import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { Tables } from '@/src/types/supabase';

type JackModule = Tables<'jack_modules'>;
type Faceplate = Tables<'faceplates'>;

export interface CompatibilityInfo {
  compatibleBrands: string[];
  compatibleProductLines: string[];
  hasCompatibility: boolean;
}

/**
 * Get compatibility information based on jack modules in shopping list
 */
export async function getJackModuleCompatibility(shoppingListItems: any[]): Promise<CompatibilityInfo> {
  logger.info('[Compatibility Service] Checking jack module compatibility', { 
    itemCount: shoppingListItems.length 
  });

  const compatibilityInfo: CompatibilityInfo = {
    compatibleBrands: [],
    compatibleProductLines: [],
    hasCompatibility: false
  };

  try {
    // Filter for jack modules in the shopping list
    const jackModules = shoppingListItems.filter(item => 
      item.table_source === 'jack_modules' || 
      item.category === 'Jack Module' ||
      item.productType === 'Jack Module'
    );

    if (jackModules.length === 0) {
      logger.info('[Compatibility Service] No jack modules found in shopping list');
      return compatibilityInfo;
    }

    // Get unique compatible faceplates values from jack modules
    const compatibleFaceplateValues = new Set<string>();
    const jackBrands = new Set<string>();

    for (const jackModule of jackModules) {
      // Add brand
      if (jackModule.brand) {
        jackBrands.add(jackModule.brand);
      }

      // Check for compatible_faceplates field
      if (jackModule.compatibleFaceplates || jackModule.compatible_faceplates) {
        const compatValue = jackModule.compatibleFaceplates || jackModule.compatible_faceplates;
        compatibleFaceplateValues.add(compatValue);
      }
      // Also check if there's a product_line that might indicate compatibility
      else if (jackModule.productLine || jackModule.product_line) {
        const productLine = jackModule.productLine || jackModule.product_line;
        compatibleFaceplateValues.add(productLine);
      }
    }

    if (compatibleFaceplateValues.size > 0) {
      // Convert to arrays
      compatibilityInfo.compatibleProductLines = Array.from(compatibleFaceplateValues);
      compatibilityInfo.compatibleBrands = Array.from(jackBrands);
      compatibilityInfo.hasCompatibility = true;

      logger.info('[Compatibility Service] Found compatibility info', {
        brands: compatibilityInfo.compatibleBrands,
        productLines: compatibilityInfo.compatibleProductLines
      });
    } else {
      // If no specific compatibility, at least use the brand
      compatibilityInfo.compatibleBrands = Array.from(jackBrands);
      compatibilityInfo.hasCompatibility = jackBrands.size > 0;
    }

    return compatibilityInfo;
  } catch (error) {
    logger.error('[Compatibility Service] Error checking compatibility', { error });
    return compatibilityInfo;
  }
}

/**
 * Get compatibility information based on faceplates in shopping list
 */
export async function getFaceplateCompatibility(shoppingListItems: any[]): Promise<CompatibilityInfo> {
  logger.info('[Compatibility Service] Checking faceplate compatibility', { 
    itemCount: shoppingListItems.length 
  });

  const compatibilityInfo: CompatibilityInfo = {
    compatibleBrands: [],
    compatibleProductLines: [],
    hasCompatibility: false
  };

  try {
    // Filter for faceplates/surface mount boxes in the shopping list
    const faceplates = shoppingListItems.filter(item => 
      item.table_source === 'faceplates' || 
      item.category === 'Faceplate' ||
      item.productType === 'Faceplate' ||
      item.productType === 'Surface Mount Box'
    );

    if (faceplates.length === 0) {
      logger.info('[Compatibility Service] No faceplates found in shopping list');
      return compatibilityInfo;
    }

    // Get unique compatible jack values from faceplates
    const compatibleJackValues = new Set<string>();
    const faceplateBrands = new Set<string>();

    for (const faceplate of faceplates) {
      // Add brand
      if (faceplate.brand) {
        faceplateBrands.add(faceplate.brand);
      }

      // Check for compatible_jacks field
      if (faceplate.compatibleJacks || faceplate.compatible_jacks) {
        const compatValue = faceplate.compatibleJacks || faceplate.compatible_jacks;
        compatibleJackValues.add(compatValue);
      }
      // Also check if there's a product_line that might indicate compatibility
      else if (faceplate.productLine || faceplate.product_line) {
        const productLine = faceplate.productLine || faceplate.product_line;
        compatibleJackValues.add(productLine);
      }
    }

    if (compatibleJackValues.size > 0) {
      // Convert to arrays
      compatibilityInfo.compatibleProductLines = Array.from(compatibleJackValues);
      compatibilityInfo.compatibleBrands = Array.from(faceplateBrands);
      compatibilityInfo.hasCompatibility = true;

      logger.info('[Compatibility Service] Found compatibility info', {
        brands: compatibilityInfo.compatibleBrands,
        productLines: compatibilityInfo.compatibleProductLines
      });
    } else {
      // If no specific compatibility, at least use the brand
      compatibilityInfo.compatibleBrands = Array.from(faceplateBrands);
      compatibilityInfo.hasCompatibility = faceplateBrands.size > 0;
    }

    return compatibilityInfo;
  } catch (error) {
    logger.error('[Compatibility Service] Error checking compatibility', { error });
    return compatibilityInfo;
  }
}

/**
 * Apply compatibility filters to AI analysis
 */
export function applyCompatibilityFilters(
  aiAnalysis: any, 
  compatibilityInfo: CompatibilityInfo
): any {
  if (!compatibilityInfo.hasCompatibility) {
    return aiAnalysis;
  }

  // Create enhanced AI analysis with compatibility filters
  const enhancedAnalysis = {
    ...aiAnalysis,
    detectedSpecs: {
      ...(aiAnalysis?.detectedSpecs || {}),
    }
  };

  // Add brand filter if we have compatible brands
  if (compatibilityInfo.compatibleBrands.length > 0) {
    enhancedAnalysis.brand = compatibilityInfo.compatibleBrands;
    enhancedAnalysis.detectedSpecs.manufacturer = compatibilityInfo.compatibleBrands[0];
  }

  // Add product line filter if we have compatible product lines
  if (compatibilityInfo.compatibleProductLines.length > 0) {
    enhancedAnalysis.productLine = compatibilityInfo.compatibleProductLines;
    enhancedAnalysis.detectedSpecs.productLine = compatibilityInfo.compatibleProductLines[0];
  }

  logger.info('[Compatibility Service] Applied compatibility filters', {
    brands: compatibilityInfo.compatibleBrands,
    productLines: compatibilityInfo.compatibleProductLines
  });

  return enhancedAnalysis;
}