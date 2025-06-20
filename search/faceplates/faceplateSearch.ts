import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';
import { AISearchAnalysis } from '@/types/search';
import { logger } from '@/utils/logger';
import { Tables } from '@/src/types/supabase';
import { detectColor, detectSurfaceMountBox, detectFaceplateType } from '@/search/shared/industryKnowledge';
import { sanitizeForTsquery } from '@/search/shared/searchUtils';

type Faceplate = Tables<'faceplates'>;

export interface FaceplateSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
  shoppingListContext?: {
    hasItems: boolean
    jackModules?: Array<{
      partNumber: string
      categoryRating: string
      brand: string
      productLine: string
      compatibleFaceplates: string
      description: string
    }>
  }
}

export interface FaceplateSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

export async function searchFaceplates(
  options: FaceplateSearchOptions
): Promise<FaceplateSearchResult> {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100, shoppingListContext } = options
  logger.info('[Faceplate Search] Starting search', { searchTerm, aiAnalysis, hasShoppingListContext: !!shoppingListContext });

  try {
    // Extract compatibility info from shopping list context
    let contextBrands: string[] = [];
    let contextProductLines: string[] = [];
    
    if (shoppingListContext?.hasItems && shoppingListContext.jackModules && shoppingListContext.jackModules.length > 0) {
      // Get unique brands and product lines from jack modules in cart
      const brands = new Set<string>();
      const productLines = new Set<string>();
      const compatibleFaceplateValues = new Set<string>();
      
      shoppingListContext.jackModules.forEach(jack => {
        if (jack.brand) {
          brands.add(jack.brand);
        }
        if (jack.productLine) {
          productLines.add(jack.productLine);
        }
        
        // IMPORTANT: Also extract compatible faceplate values
        if (jack.compatibleFaceplates) {
          // Handle various formats: "Keystone", "{Keystone}", "Keystone, Mini-Com", etc.
          const cleanValue = jack.compatibleFaceplates
            .replace(/[{}]/g, '') // Remove curly braces if present
            .trim();
          
          // Split by comma if multiple values
          if (cleanValue.includes(',')) {
            cleanValue.split(',').forEach(val => {
              const trimmed = val.trim();
              if (trimmed) {
                compatibleFaceplateValues.add(trimmed);
              }
            });
          } else if (cleanValue) {
            compatibleFaceplateValues.add(cleanValue);
          }
        }
      });
      
      contextBrands = Array.from(brands);
      contextProductLines = Array.from(productLines);
      
      // Add compatible faceplate values to product lines
      compatibleFaceplateValues.forEach(value => {
        contextProductLines.push(value);
      });
      
      // Remove duplicates
      contextProductLines = [...new Set(contextProductLines)];
      
      logger.info('[Faceplate Search] Extracted compatibility info from shopping list', {
        contextBrands,
        contextProductLines,
        compatibleFaceplateValues: Array.from(compatibleFaceplateValues),
        jackCount: shoppingListContext.jackModules.length
      });
    }

    // Build the query
    let query = supabase
      .from('prod_faceplates')
      .select('*')
      .eq('is_active', true)
      // Exclude surface mount boxes from faceplate searches
      .not('product_type', 'ilike', '%Surface Mount Box%');

    // Part number search (highest priority)
    const cleanedTerm = searchTerm.trim().toUpperCase();
    const isPartNumber = /^[A-Z-9\-]{3,}$/.test(cleanedTerm);
    
    // Build search conditions array
    const searchConditions: string[] = [];
    
    // Extract values for logging
    let portsMatch: RegExpMatchArray | null = null;
    let colorValue: string | null = null;
    let brandValue: string | undefined;
    let productLineValue: string | undefined;
    
    // Variables for post-query filtering
    let needsPostFiltering = false;
    let postFilterBrand: string | undefined;
    let postFilterProductLines: string[] = [];
    let postFilterColor: string | undefined;
    
    // Detect faceplate type specifications
    const faceplateTypeInfo = detectFaceplateType(searchTerm);
    
    if (isPartNumber) {
      searchConditions.push(`part_number.ilike.%${cleanedTerm}%`);
      searchConditions.push(`part_number.ilike.${cleanedTerm}%`);
      searchConditions.push(`short_description.ilike.%${cleanedTerm}%`);
      searchConditions.push(`common_terms.ilike.%${cleanedTerm}%`);
      searchConditions.push(`possible_cross.ilike.%${cleanedTerm}%`);
    }
    
    // Always detect color early
    colorValue = detectColor(searchTerm);
    if (colorValue) {
      logger.info('[Faceplate Search] Color detected', { color: colorValue });
    }
    
    // Always check for port count
    portsMatch = searchTerm.match(/(\d+)\s*port/i);
    if (portsMatch && portsMatch[1]) {
      const numberOfPorts = parseInt(portsMatch[1]);
      if (!isNaN(numberOfPorts)) {
        query = query.eq('number_of_ports', numberOfPorts);
        logger.info('[Faceplate Search] Port count detected', { ports: numberOfPorts });
      }
    }
    
    // Apply AI analysis filters
    if (aiAnalysis) {
      // Log that we're doing a faceplate search
      logger.info('[Faceplate Search] Processing faceplate search with AI analysis');

      // Apply keystone type filter if detected
      if (faceplateTypeInfo.isKeystone) {
        searchConditions.push(`type.ilike.%keystone%`);
        searchConditions.push(`type.ilike.%modular%`);
        searchConditions.push(`common_terms.ilike.%keystone%`);
        logger.info('[Faceplate Search] Filtering for keystone type');
      }
      
      // Apply gang count filter if detected
      if (faceplateTypeInfo.gangCount) {
        query = query.eq('number_gang', `${faceplateTypeInfo.gangCount}`);
        logger.info('[Faceplate Search] Filtering for gang count', { gangCount: faceplateTypeInfo.gangCount });
      }

      // Build compatibility search conditions FIRST (before color detection)
      brandValue = aiAnalysis.detectedSpecs?.manufacturer;
      productLineValue = aiAnalysis.detectedSpecs?.productLine;
      
      // Remove any curly braces that might have been added by AI
      if (productLineValue) {
        productLineValue = productLineValue.replace(/[{}]/g, '');
        logger.info('[Faceplate Search] Cleaned product line value', { 
          original: aiAnalysis.detectedSpecs?.productLine,
          cleaned: productLineValue 
        });
      }
      
      // IMPORTANT: Check if AI detected brand matches jack brands in context
      // If so, this is likely a compatibility search, not a brand search
      const isCompatibilitySearch = brandValue && contextBrands.includes(brandValue) && contextProductLines.length > 0;
      
      if (isCompatibilitySearch) {
        logger.info('[Faceplate Search] Detected compatibility search - using product line only', {
          detectedBrand: brandValue,
          contextBrands,
          contextProductLines
        });
        // Clear the brand to prevent filtering by jack brand
        brandValue = undefined;
        // Use compatibility product lines instead
        productLineValue = contextProductLines.join(',');
      }
      
      // If no brand/product line from AI, use shopping list context
      else if (!brandValue && !productLineValue && contextBrands.length > 0) {
        logger.info('[Faceplate Search] No brand/product line from AI, using shopping list context', {
          contextBrands,
          contextProductLines
        });
        
        // Use context values as fallback
        if (contextProductLines.length > 0) {
          productLineValue = contextProductLines.join(',');
          logger.info('[Faceplate Search] Using context product lines', { productLineValue });
        }
        
        // Don't force brand from context - let product line be the main filter
        // This allows Keystone faceplates to show regardless of jack brand
      }

      // Use AI-detected color if available and different from text-detected
      if (aiAnalysis.detectedSpecs?.color && aiAnalysis.detectedSpecs.color !== colorValue) {
        colorValue = aiAnalysis.detectedSpecs.color;
        logger.info('[Faceplate Search] Using AI-detected color', { color: colorValue });
      }
      
      if (brandValue || productLineValue) {
        logger.info('[Faceplate Search] Applying compatibility filters', { 
          brand: brandValue, 
          productLine: productLineValue 
        });
        
        // IMPORTANT: For compatibility, we need to ensure AND logic between brand and product line
        if (brandValue && productLineValue) {
          // Both brand AND product line must match
          // Since Supabase doesn't easily support complex AND/OR combinations,
          // we'll filter by brand in the query and product line in post-processing
          needsPostFiltering = true;
          postFilterBrand = brandValue;
          postFilterProductLines = productLineValue.split(',').map(pl => pl.trim()).filter(pl => pl);
          
          logger.info('[Faceplate Search] Will enforce brand AND product line match', { 
            brand: brandValue,
            productLines: postFilterProductLines
          });
          
          // First filter by brand in the query
          query = query.or(`brand.ilike.%${brandValue}%,brand_normalized.ilike.%${brandValue}%`);
          
        } else if (brandValue) {
          // Just brand filter
          logger.info('[Faceplate Search] Searching for brand match only', { brand: brandValue });
          query = query.or(`brand.ilike.%${brandValue}%,brand_normalized.ilike.%${brandValue}%`);
        } else if (productLineValue) {
          // Just product line filter
          const productLines = productLineValue.split(',').map(pl => pl.trim()).filter(pl => pl);
          logger.info('[Faceplate Search] Searching for product line match only', { productLines });
          
          if (productLines.length > 0) {
            // Check both product_line and type fields for compatibility
            // Some faceplates might have "Keystone" in type instead of product_line
            const plConditions: string[] = [];
            productLines.forEach(pl => {
              plConditions.push(`product_line.ilike.%${pl}%`);
              // Also check type field for keystone compatibility
              if (pl.toLowerCase().includes('keystone')) {
                plConditions.push(`type.ilike.%keystone%`);
                plConditions.push(`product_type.ilike.%keystone%`);
              }
            });
            
            // Combine all conditions including array check
            // For arrays in Supabase, we use 'cs' (contains) with curly braces
            productLines.forEach(pl => {
              // Check if the array contains this value
              plConditions.push(`compatible_jacks.cs.{${pl}}`);
            });
            
            if (plConditions.length > 0) {
              query = query.or(plConditions.join(','));
            }
          }
        }
      }
    }
    
    // Apply color filter if detected and no compatibility filters
    if (colorValue && !brandValue && !productLineValue) {
      query = query.ilike('color', `%${colorValue}%`);
      logger.info('[Faceplate Search] Applied color filter directly', { color: colorValue });
    } else if (colorValue && (brandValue || productLineValue)) {
      // Need to post-filter color when we have compatibility filters
      postFilterColor = colorValue || undefined;
      needsPostFiltering = true;
      logger.info('[Faceplate Search] Will apply color filter in post-processing', { color: colorValue });
    }
    
    // Add general text search if not a part number
    if (!isPartNumber && aiAnalysis === null) {
      // No AI analysis - for simple faceplate searches without AI,
      // we'll rely on the port and color filters already applied
      // and use text search for the main query
      logger.info('[Faceplate Search] No AI analysis - using simplified search');
      
      // Check if we should apply shopping list context filters
      if (contextBrands.length > 0 && !brandValue && !productLineValue) {
        logger.info('[Faceplate Search] Applying shopping list context filters for non-AI search', {
          contextBrands,
          contextProductLines
        });
        
        // Apply brand filter from context
        if (contextBrands.length === 1) {
          // Single brand - direct filter
          query = query.or(`brand.ilike.%${contextBrands[0]}%,brand_normalized.ilike.%${contextBrands[0]}%`);
        } else {
          // Multiple brands - OR condition
          const brandConditions = contextBrands.map(brand => 
            `brand.ilike.%${brand}%,brand_normalized.ilike.%${brand}%`
          ).join(',');
          query = query.or(brandConditions);
        }
        
        // Mark for post-filtering if we have product lines
        if (contextProductLines.length > 0) {
          needsPostFiltering = true;
          postFilterProductLines = contextProductLines;
        }
      }
      
      // Don't add many search conditions - let text search handle it
      // This prevents the extremely long OR conditions
    }
    
    // Apply search conditions
    if (searchConditions.length > 0 && !brandValue && !productLineValue) {
      // Regular search without compatibility filters
      query = query.or(searchConditions.join(','));
    } else if (!brandValue && !productLineValue && searchConditions.length === 0) {
      // No conditions at all - use text search
      const sanitizedTerm = sanitizeForTsquery(searchTerm);
      query = query.textSearch('search_vector', sanitizedTerm);
    }
    // If we have brand/product line filters, they've already been applied above

    // Log the final query for debugging
    logger.info('[Faceplate Search] Query conditions', { 
      searchConditions: searchConditions.length,
      hasPortFilter: !!portsMatch,
      hasColorFilter: !!colorValue,
      colorValue: colorValue,
      hasBrandFilter: !!brandValue,
      hasProductLineFilter: !!productLineValue,
      hasKeystoneFilter: faceplateTypeInfo.isKeystone,
      hasGangFilter: !!faceplateTypeInfo.gangCount,
      gangCount: faceplateTypeInfo.gangCount,
      willPostFilter: needsPostFiltering,
      brandValue: brandValue,
      productLineValue: productLineValue
    });

    // Execute query
    const { data, error } = await query.limit(limit);

    let faceplates: Faceplate[] = [];
    
    if (error) {
      logger.error('[Faceplate Search] Database error', { error });
      
      // If tsquery error, try simpler search
      if (error.message?.includes('syntax error in tsquery')) {
        logger.info('[Faceplate Search] Retrying with simpler search due to tsquery error');
        
        // Build a simpler query without text search
        let simpleQuery = supabase
          .from('prod_faceplates')
          .select('*')
          .eq('is_active', true)
          .not('product_type', 'ilike', '%Surface Mount Box%');
        
        // Apply filters
        if (portsMatch) {
          const portCount = parseInt(portsMatch[1]);
          simpleQuery = simpleQuery.eq('number_of_ports', portCount);
        }
        if (colorValue) {
          simpleQuery = simpleQuery.ilike('color', `%${colorValue}%`);
        }
        
        const simpleResult = await simpleQuery.limit(limit);
        
        if (!simpleResult.error && simpleResult.data) {
          faceplates = simpleResult.data as unknown as Faceplate[];
          // Note: Used fallback search due to tsquery error
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      faceplates = (data as unknown as Faceplate[]) || [];
    }
    
    // Apply post-query filtering for complex AND conditions
    if (needsPostFiltering && faceplates.length > 0) {
      const beforeCount = faceplates.length;
      logger.info('[Faceplate Search] Applying post-query filters', {
        beforeCount: beforeCount,
        hasProductLineFilter: postFilterProductLines.length > 0,
        hasColorFilter: !!postFilterColor
      });
      
      // Apply product line filter - check BOTH product_line AND compatible_jacks
      if (postFilterProductLines.length > 0) {
        faceplates = faceplates.filter((faceplate: any) => {
          // First check if product_line matches
          if (faceplate.product_line) {
            const faceplateProductLine = faceplate.product_line.toLowerCase().replace(/\s+/g, '').trim();
            
            const productLineMatches = postFilterProductLines.some(requiredPL => {
              const normalizedRequired = requiredPL.toLowerCase().replace(/\s+/g, '').trim();
              
              return faceplateProductLine === normalizedRequired || 
                     faceplateProductLine.includes(normalizedRequired) ||
                     normalizedRequired.includes(faceplateProductLine);
            });
            
            if (productLineMatches) return true;
          }
          
          // Also check if any required product line is in compatible_jacks array
          if (faceplate.compatible_jacks && Array.isArray(faceplate.compatible_jacks)) {
            return postFilterProductLines.some(requiredPL => {
              // Check if this product line exists in the compatible_jacks array
              return faceplate.compatible_jacks.includes(requiredPL);
            });
          }
          
          return false;
        });
      }
      
      // Apply color filter
      if (postFilterColor) {
        faceplates = faceplates.filter((faceplate: any) => {
          if (!faceplate.color) return false;
          
          const faceplateColor = faceplate.color.toLowerCase();
          const targetColor = postFilterColor!.toLowerCase();
          
          // Special handling for stainless steel
          if (targetColor === 'stainless steel') {
            return faceplateColor.includes('stainless') || 
                   faceplateColor.includes('steel') ||
                   faceplateColor.includes('chrome') ||
                   faceplateColor.includes('metallic') ||
                   faceplateColor.includes('silver') ||
                   faceplateColor.includes('nickel') ||
                   faceplateColor.includes('brushed') ||
                   faceplateColor.includes('satin');
          }
          
          // Regular color matching
          return faceplateColor.includes(targetColor);
        });
      }
      
      logger.info('[Faceplate Search] Post-query filter results', {
        afterCount: faceplates.length,
        filtered: beforeCount - faceplates.length
      });
    }
    
    // Log result summary for debugging
    if (faceplates.length > 0) {
      const brands = [...new Set(faceplates.map((f: any) => f.brand))].filter(Boolean);
      const productLines = [...new Set(faceplates.map((f: any) => f.product_line))].filter(Boolean);
      const productTypes = [...new Set(faceplates.map((f: any) => f.product_type))].filter(Boolean);
      
      logger.info('[Faceplate Search] Found results', { 
        count: faceplates.length,
        brands: brands.join(', '),
        productLines: productLines.join(', '),
        productTypes: productTypes.join(', ')
      });
    } else {
      logger.info('[Faceplate Search] Found results', { count: 0 });
    }

    // If no results with compatibility filters, try a broader search
    if (faceplates.length === 0 && (brandValue || productLineValue)) {
      logger.info('[Faceplate Search] No results with compatibility filters, trying broader search', {
        hadBrandFilter: !!brandValue,
        hadProductLineFilter: !!productLineValue,
        wasPostFiltered: needsPostFiltering
      });
      
      // Reset query
      query = supabase
        .from('prod_faceplates')
        .select('*')
        .eq('is_active', true);
      
      // Apply only essential filters
      if (portsMatch && portsMatch[1]) {
        const numberOfPorts = parseInt(portsMatch[1]);
        if (!isNaN(numberOfPorts)) {
          query = query.eq('number_of_ports', numberOfPorts);
        }
      }
      
      // Try a simpler approach for the fallback - just get all faceplates
      // and let the port filter do the work
      // Don't use text search in fallback as it's causing issues
      
      // If we have context product lines (like Keystone), search for those
      if (contextProductLines.length > 0) {
        const plConditions: string[] = [];
        contextProductLines.forEach(pl => {
          plConditions.push(`product_line.ilike.%${pl}%`);
          plConditions.push(`type.ilike.%${pl}%`);
          plConditions.push(`product_type.ilike.%${pl}%`);
          plConditions.push(`common_terms.ilike.%${pl}%`);
          // Check compatible_jacks array using contains operator
          plConditions.push(`compatible_jacks.cs.{${pl}}`);
        });
        query = query.or(plConditions.join(','));
      } else {
        // Just get all active faceplates with the port filter
        // No additional conditions needed
      }
      
      const fallbackResult = await query.limit(limit);
      if (!fallbackResult.error && fallbackResult.data) {
        faceplates = (fallbackResult.data as unknown as Faceplate[]) || [];
        
        // Log fallback result summary
        if (faceplates.length > 0) {
          const brands = [...new Set(faceplates.map((f: any) => f.brand))].filter(Boolean);
          const productLines = [...new Set(faceplates.map((f: any) => f.product_line))].filter(Boolean);
          const productTypes = [...new Set(faceplates.map((f: any) => f.product_type))].filter(Boolean);
          
          logger.info('[Faceplate Search] Fallback search found results', { 
            count: faceplates.length,
            brands: brands.join(', '),
            productLines: productLines.join(', '),
            productTypes: productTypes.join(', ')
          });
        } else {
          logger.info('[Faceplate Search] Fallback search found results', { count: 0 });
        }
      }
    }

    // Transform to Product format
    const products: Product[] = faceplates.map((faceplate: any) => ({
      id: `faceplate-${faceplate.id}`,
      partNumber: faceplate.part_number,
      brand: faceplate.brand,
      description: faceplate.short_description || '',
      price: Math.random() * 25 + 5, // Random price between 5-3
      stockLocal: Math.floor(Math.random() * 10),
      stockDistribution: 5,
      leadTime: 'Ships Today',
      category: faceplate.product_type || 'Faceplate',
      // Additional properties
      productLine: faceplate.product_line || undefined,
      productType: faceplate.product_type || 'Faceplate',
      color: faceplate.color || undefined,
      numberOfPorts: faceplate.number_of_ports || undefined,
      numberGang: faceplate.number_gang || undefined,
      type: faceplate.type || undefined,
      compatibleJacks: faceplate.compatible_jacks || undefined,
      // Search properties
      searchRelevance: 1.00,
      tableName: 'faceplates',
      stockStatus: 'in_stock' as const,
      stockColor: 'green' as const,
      stockMessage: 'In stock - Ships today'
    }));

    const endTime = performance.now();
    const searchTime = Math.round(endTime - startTime);

    return { 
      products, 
      searchStrategy: 'faceplate_search',
      totalFound: products.length,
      searchTime
    };
  } catch (error) {
    logger.error('[Faceplate Search] Error', { error });
    throw error;
  }
}

