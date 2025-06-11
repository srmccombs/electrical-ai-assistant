import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';
import { AISearchAnalysis } from '@/types/search';
import { logger } from '@/utils/logger';
import { Tables } from '@/src/types/supabase';
import { detectColor, detectQuantity } from '@/search/shared/industryKnowledge';

type SurfaceMountBox = Tables<'surface_mount_box'>;

export interface SurfaceMountBoxSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface SurfaceMountBoxSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

export async function searchSurfaceMountBoxes(
  options: SurfaceMountBoxSearchOptions
): Promise<SurfaceMountBoxSearchResult> {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100 } = options
  logger.info('[SMB Search] Starting search', { searchTerm, aiAnalysis });

  try {
    // Build the query
    let query = supabase
      .from('surface_mount_box')
      .select('*')
      .eq('is_active', true);

    // Part number search (highest priority)
    const cleanedTerm = searchTerm.trim().toUpperCase();
    const isPartNumber = /^[A-Z0-9\-]{3,}$/.test(cleanedTerm);
    
    // Extract values for detection
    let portsMatch: RegExpMatchArray | null = null;
    let colorValue: string | undefined;
    let brandValue: string | undefined;
    let productLineValue: string | undefined;
    
    // Variables for post-query filtering
    let needsPostFiltering = false;
    let postFilterBrand: string | undefined;
    let postFilterProductLines: string[] = [];
    let postFilterColor: string | undefined;
    
    // Always detect color early
    colorValue = detectColor(searchTerm);
    if (colorValue) {
      logger.info('[SMB Search] Color detected', { color: colorValue });
    }
    
    // Always check for port count
    portsMatch = searchTerm.match(/(\d+)\s*port/i);
    if (portsMatch && portsMatch[1]) {
      const numberOfPorts = parseInt(portsMatch[1]);
      if (!isNaN(numberOfPorts)) {
        query = query.eq('number_of_ports', numberOfPorts);
        logger.info('[SMB Search] Port count detected', { ports: numberOfPorts });
      }
    }
    
    // Apply AI analysis filters
    if (aiAnalysis) {
      // Build compatibility search conditions from AI or shopping list
      brandValue = aiAnalysis.detectedSpecs?.manufacturer;
      productLineValue = aiAnalysis.detectedSpecs?.productLine;
      
      // Remove any curly braces that might have been added by AI
      if (productLineValue) {
        productLineValue = productLineValue.replace(/[{}]/g, '');
        logger.info('[SMB Search] Cleaned product line value', { 
          original: aiAnalysis.detectedSpecs?.productLine,
          cleaned: productLineValue 
        });
      }

      // Use AI-detected color if available and different from text-detected
      if (aiAnalysis.detectedSpecs?.color && aiAnalysis.detectedSpecs.color !== colorValue) {
        colorValue = aiAnalysis.detectedSpecs.color;
        logger.info('[SMB Search] Using AI-detected color', { color: colorValue });
      }
      
      if (brandValue || productLineValue) {
        logger.info('[SMB Search] Applying compatibility filters', { 
          brand: brandValue, 
          productLine: productLineValue 
        });
        
        // IMPORTANT: For compatibility, we need to ensure AND logic between brand and product line
        if (brandValue && productLineValue) {
          // Both brand AND product line must match
          needsPostFiltering = true;
          postFilterBrand = brandValue;
          postFilterProductLines = productLineValue.split(',').map(pl => pl.trim()).filter(pl => pl);
          
          logger.info('[SMB Search] Will enforce brand AND product line match', { 
            brand: brandValue,
            productLines: postFilterProductLines
          });
          
          // First filter by brand in the query
          query = query.or(`brand.ilike.%${brandValue}%,brand_normalized.ilike.%${brandValue}%`);
          
        } else if (brandValue) {
          // Just brand filter
          logger.info('[SMB Search] Searching for brand match only', { brand: brandValue });
          query = query.or(`brand.ilike.%${brandValue}%,brand_normalized.ilike.%${brandValue}%`);
        } else if (productLineValue) {
          // Just product line filter
          const productLines = productLineValue.split(',').map(pl => pl.trim()).filter(pl => pl);
          logger.info('[SMB Search] Searching for product line match only', { productLines });
          
          if (productLines.length > 0) {
            const plConditions = productLines.map(pl => `product_line.ilike.%${pl}%`).join(',');
            query = query.or(plConditions);
          }
        }
      }
    }
    
    // Apply color filter if detected and no compatibility filters
    if (colorValue && !brandValue && !productLineValue) {
      query = query.ilike('color', `%${colorValue}%`);
      logger.info('[SMB Search] Applied color filter directly', { color: colorValue });
    } else if (colorValue && (brandValue || productLineValue)) {
      // Need to post-filter color when we have compatibility filters
      postFilterColor = colorValue;
      needsPostFiltering = true;
      logger.info('[SMB Search] Will apply color filter in post-processing', { color: colorValue });
    }
    
    // For part number searches
    if (isPartNumber) {
      const searchConditions = [
        `part_number.ilike.%${cleanedTerm}%`,
        `part_number.ilike.${cleanedTerm}%`,
        `short_description.ilike.%${cleanedTerm}%`,
        `common_terms.ilike.%${cleanedTerm}%`,
        `possible_cross.ilike.%${cleanedTerm}%`
      ];
      query = query.or(searchConditions.join(','));
    } else if (!brandValue && !productLineValue) {
      // General search - use text search
      query = query.textSearch('search_vector', searchTerm);
    }

    // Log the final query for debugging
    logger.info('[SMB Search] Query conditions', { 
      isPartNumber,
      hasPortFilter: !!portsMatch,
      hasColorFilter: !!colorValue,
      colorValue: colorValue,
      hasBrandFilter: !!brandValue,
      hasProductLineFilter: !!productLineValue,
      willPostFilter: needsPostFiltering
    });

    // Execute query
    const { data, error } = await query.limit(limit);

    if (error) {
      logger.error('[SMB Search] Database error', { error });
      throw error;
    }

    let surfaceMountBoxes = data || [];
    
    // Apply post-query filtering for complex AND conditions
    if (needsPostFiltering && surfaceMountBoxes.length > 0) {
      const beforeCount = surfaceMountBoxes.length;
      logger.info('[SMB Search] Applying post-query filters', {
        beforeCount: beforeCount,
        hasProductLineFilter: postFilterProductLines.length > 0,
        hasColorFilter: !!postFilterColor
      });
      
      // Apply product line filter
      if (postFilterProductLines.length > 0) {
        surfaceMountBoxes = surfaceMountBoxes.filter((smb: any) => {
          if (!smb.product_line) return false;
          
          // Normalize the SMB's product line for comparison
          const smbProductLine = smb.product_line.toLowerCase().replace(/\s+/g, '').trim();
          
          // Check if the SMB's product line matches any of the required product lines
          return postFilterProductLines.some(requiredPL => {
            // Normalize the required product line for comparison
            const normalizedRequired = requiredPL.toLowerCase().replace(/\s+/g, '').trim();
            
            // Check for exact match or containment
            return smbProductLine === normalizedRequired || 
                   smbProductLine.includes(normalizedRequired) ||
                   normalizedRequired.includes(smbProductLine);
          });
        });
      }
      
      // Apply color filter
      if (postFilterColor) {
        surfaceMountBoxes = surfaceMountBoxes.filter((smb: any) => {
          if (!smb.color) return false;
          
          const smbColor = smb.color.toLowerCase();
          const targetColor = postFilterColor!.toLowerCase();
          
          // Regular color matching
          return smbColor.includes(targetColor);
        });
      }
      
      logger.info('[SMB Search] Post-query filter results', {
        afterCount: surfaceMountBoxes.length,
        filtered: beforeCount - surfaceMountBoxes.length
      });
    }
    
    // Log result summary for debugging
    if (surfaceMountBoxes.length > 0) {
      const brands = [...new Set(surfaceMountBoxes.map((s: any) => s.brand))].filter(Boolean);
      const productLines = [...new Set(surfaceMountBoxes.map((s: any) => s.product_line))].filter(Boolean);
      
      logger.info('[SMB Search] Found results', { 
        count: surfaceMountBoxes.length,
        brands: brands.join(', '),
        productLines: productLines.join(', ')
      });
    } else {
      logger.info('[SMB Search] Found results', { count: 0 });
    }

    // If no results with compatibility filters, try a broader search
    if (surfaceMountBoxes.length === 0 && (brandValue || productLineValue)) {
      logger.info('[SMB Search] No results with compatibility filters, trying broader search');
      
      // Reset query
      query = supabase
        .from('surface_mount_box')
        .select('*')
        .eq('is_active', true);
      
      // Apply only essential filters
      if (portsMatch && portsMatch[1]) {
        const numberOfPorts = parseInt(portsMatch[1]);
        if (!isNaN(numberOfPorts)) {
          query = query.eq('number_of_ports', numberOfPorts);
        }
      }
      
      // Use text search for the term
      query = query.textSearch('search_vector', searchTerm);
      
      const fallbackResult = await query.limit(limit);
      if (!fallbackResult.error && fallbackResult.data) {
        surfaceMountBoxes = fallbackResult.data;
        logger.info('[SMB Search] Fallback search found', { count: surfaceMountBoxes.length });
      }
    }

    // Transform to Product format
    const products: Product[] = surfaceMountBoxes.map((smb: any) => ({
      id: `smb-${smb.id}`,
      partNumber: smb.part_number,
      brand: smb.brand,
      description: smb.short_description || '',
      price: Math.random() * 30 + 10, // Random price between 10-40
      stockLocal: Math.floor(Math.random() * 100),
      stockDistribution: 500,
      leadTime: 'Ships Today',
      category: 'Surface Mount Box',
      // Additional properties
      productLine: smb.product_line || undefined,
      productType: 'Surface Mount Box',
      color: smb.color || undefined,
      numberOfPorts: smb.number_of_ports || undefined,
      numberGang: smb.number_gang || undefined,
      type: smb.type || undefined,
      compatibleJacks: smb.compatible_jacks || undefined,
      mountingDepth: smb.mounting_depth || undefined,
      material: smb.material || undefined,
      // Search properties
      searchRelevance: 1.0,
      tableName: 'surface_mount_box',
      stockStatus: 'in_stock' as const,
      stockColor: 'green' as const,
      stockMessage: 'In stock - Ships today'
    }));

    const endTime = performance.now();
    const searchTime = Math.round(endTime - startTime);

    return { 
      products, 
      searchStrategy: 'surface_mount_box_search',
      totalFound: products.length,
      searchTime
    };
  } catch (error) {
    logger.error('[SMB Search] Error', { error });
    throw error;
  }
}