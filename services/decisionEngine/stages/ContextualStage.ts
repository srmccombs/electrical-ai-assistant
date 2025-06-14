// ContextualStage.ts
// Handles shopping list context and compatibility hints

import { DecisionStage, ContextPriority } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'

export class ContextualStage implements DecisionStage {
  name = 'ContextualStage'
  priority = 3 // Third priority - after part numbers

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info('ContextualStage: Processing context')

    if (!decision.context?.shoppingList) {
      logger.info('ContextualStage: No shopping list context')
      return decision
    }

    const shoppingList = decision.context.shoppingList
    let result = decision

    // Check for jack modules in cart
    if (shoppingList.jackModules && shoppingList.jackModules.length > 0) {
      result = this.handleJackModuleContext(result, shoppingList.jackModules)
    }

    // Check for cables in cart
    if (shoppingList.cables && shoppingList.cables.length > 0) {
      result = this.handleCableContext(result, shoppingList.cables)
    }

    // Check for fiber products in cart
    if (shoppingList.fiberProducts && shoppingList.fiberProducts.length > 0) {
      result = this.handleFiberContext(result, shoppingList.fiberProducts)
    }

    // Check for faceplates or SMBs in cart
    if (shoppingList.faceplates && shoppingList.faceplates.length > 0) {
      result = this.handleFaceplateContext(result, shoppingList.faceplates)
    }

    if (shoppingList.surfaceMountBoxes && shoppingList.surfaceMountBoxes.length > 0) {
      result = this.handleSMBContext(result, shoppingList.surfaceMountBoxes)
    }

    return result
  }

  private handleJackModuleContext(decision: SearchDecision, jackModules: any[]): SearchDecision {
    // Extract brands and categories from jack modules
    const brands = [...new Set(jackModules.map(j => j.brand).filter(Boolean))]
    const categories = [...new Set(jackModules.map(j => j.category).filter(Boolean))]
    const productLines = [...new Set(jackModules.map(j => j.product_line).filter(Boolean))]

    let result = decision

    // If searching for faceplates or SMBs, suggest compatible brands
    if (decision.hasAnyKeyword(['faceplate', 'face plate', 'wall plate', 'smb', 'surface mount'])) {
      if (brands.length > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'SUGGEST',
          message: `You have ${brands.join(', ')} jack modules. Consider matching ${brands.join(' or ')} faceplates/SMBs for best compatibility.`,
          data: {
            compatibleBrands: brands,
            compatibleProductLines: productLines,
            reason: 'Jack module compatibility'
          },
          source: 'ContextualStage'
        })
      }

      // Add category compatibility hint
      if (categories.length > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'FILTER',
          message: `Looking for ${categories.join('/')} compatible faceplates`,
          data: {
            requiredCategories: categories
          },
          source: 'ContextualStage'
        })
      }
    }

    return result
  }

  private handleCableContext(decision: SearchDecision, cables: any[]): SearchDecision {
    // Extract cable types and categories
    const cableTypes = [...new Set(cables.map(c => c.category).filter(Boolean))]
    const brands = [...new Set(cables.map(c => c.brand).filter(Boolean))]

    let result = decision

    // If searching for connectors or jacks, suggest compatible types
    if (decision.hasAnyKeyword(['connector', 'jack', 'keystone', 'termination'])) {
      if (cableTypes.length > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'FILTER',
          message: `You have ${cableTypes.join('/')} cables. Showing compatible termination products.`,
          data: {
            cableTypes,
            requiredCompatibility: cableTypes
          },
          source: 'ContextualStage'
        })
      }
    }

    // If searching for more cable, suggest same brand
    if (decision.hasAnyKeyword(['cable', 'cat5e', 'cat6', 'cat6a'])) {
      if (brands.length > 0) {
        result = result.addHint({
          type: 'SUGGEST',
          priority: 'SUGGEST',
          message: `You've been using ${brands.join(', ')} cables`,
          data: { preferredBrands: brands },
          source: 'ContextualStage'
        })
      }
    }

    return result
  }

  private handleFiberContext(decision: SearchDecision, fiberProducts: any[]): SearchDecision {
    // Extract fiber types (OM3, OM4, OS2, etc.)
    const fiberTypes = new Set<string>()
    const connectorTypes = new Set<string>()

    fiberProducts.forEach(product => {
      // Extract fiber type from product details
      if (product.fiber_type) {
        fiberTypes.add(product.fiber_type)
      }
      
      // Look for fiber type in description
      const typeMatch = product.description?.match(/\b(OM[1-4]|OS[12])\b/i)
      if (typeMatch) {
        fiberTypes.add(typeMatch[1].toUpperCase())
      }

      // Extract connector types
      if (product.connector_type) {
        connectorTypes.add(product.connector_type)
      }
    })

    let result = decision

    // If searching for fiber products, ensure compatibility
    if (decision.hasAnyKeyword(['fiber', 'connector', 'adapter', 'patch'])) {
      if (fiberTypes.size > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'FILTER',
          message: `Filtering for ${Array.from(fiberTypes).join('/')} fiber compatibility`,
          data: {
            requiredFiberTypes: Array.from(fiberTypes),
            filterType: 'fiber_compatibility'
          },
          source: 'ContextualStage'
        })
      }

      if (connectorTypes.size > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'SUGGEST',
          message: `You have ${Array.from(connectorTypes).join('/')} connectors in cart`,
          data: {
            existingConnectorTypes: Array.from(connectorTypes)
          },
          source: 'ContextualStage'
        })
      }
    }

    return result
  }

  private handleFaceplateContext(decision: SearchDecision, faceplates: any[]): SearchDecision {
    const brands = [...new Set(faceplates.map(f => f.brand).filter(Boolean))]
    const portCounts = [...new Set(faceplates.map(f => f.ports).filter(Boolean))]

    let result = decision

    // If searching for jacks, suggest compatible brands
    if (decision.hasAnyKeyword(['jack', 'keystone', 'module'])) {
      if (brands.length > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'SUGGEST',
          message: `You have ${brands.join(', ')} faceplates. Consider matching jack modules.`,
          data: {
            faceplateBrands: brands,
            suggestBrands: brands
          },
          source: 'ContextualStage'
        })
      }
    }

    return result
  }

  private handleSMBContext(decision: SearchDecision, smbs: any[]): SearchDecision {
    const brands = [...new Set(smbs.map(s => s.brand).filter(Boolean))]
    const portCounts = [...new Set(smbs.map(s => s.ports).filter(Boolean))]

    let result = decision

    // Similar to faceplate context
    if (decision.hasAnyKeyword(['jack', 'keystone', 'module'])) {
      if (brands.length > 0) {
        result = result.addHint({
          type: 'COMPATIBILITY',
          priority: 'SUGGEST',
          message: `You have ${brands.join(', ')} surface mount boxes. Consider matching jack modules.`,
          data: {
            smbBrands: brands,
            suggestBrands: brands
          },
          source: 'ContextualStage'
        })
      }
    }

    return result
  }

  // Helper method to extract compatibility requirements
  private extractCompatibilityRequirements(shoppingList: any): any {
    const requirements = {
      brands: new Set<string>(),
      categories: new Set<string>(),
      fiberTypes: new Set<string>(),
      productLines: new Set<string>()
    }

    // Aggregate from all products
    Object.values(shoppingList).forEach((products: any) => {
      if (Array.isArray(products)) {
        products.forEach(product => {
          if (product.brand) requirements.brands.add(product.brand)
          if (product.category) requirements.categories.add(product.category)
          if (product.fiber_type) requirements.fiberTypes.add(product.fiber_type)
          if (product.product_line) requirements.productLines.add(product.product_line)
        })
      }
    })

    return {
      brands: Array.from(requirements.brands),
      categories: Array.from(requirements.categories),
      fiberTypes: Array.from(requirements.fiberTypes),
      productLines: Array.from(requirements.productLines)
    }
  }
}