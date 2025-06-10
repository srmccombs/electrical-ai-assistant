// /config/productTypes.ts
// Centralized configuration for all product types
// This makes it easy to add new products - just update this file!

export interface ProductTypeConfig {
  tableName: string
  displayName: string
  searchModule: () => Promise<any>
  aiKeywords: string[]
  requiredColumns: string[]
  specialFields: {
    [key: string]: {
      dbColumn: string
      filterLabel: string
      filterType?: 'color' | 'standard'
    }
  }
  tablePrefix: string
  category: string
}

export const PRODUCT_TYPES: Record<string, ProductTypeConfig> = {
  category_cables: {
    tableName: 'category_cables',
    displayName: 'Category Cable',
    searchModule: () => import('@/search/categoryCables/categoryCableSearch'),
    aiKeywords: ['cable', 'cat5e', 'cat6', 'cat6a', 'ethernet', 'network', 'plenum', 'riser', 'cmr', 'cmp'],
    requiredColumns: ['part_number', 'brand', 'short_description', 'jacket_code'],
    tablePrefix: 'cat',
    category: 'Cable',
    specialFields: {
      categoryRating: {
        dbColumn: 'category_rating',
        filterLabel: 'Categories'
      },
      jacketRating: {
        dbColumn: 'jacket_rating',
        filterLabel: 'Jacket Ratings'
      },
      jacketCode: {
        dbColumn: 'jacket_code',
        filterLabel: 'Jacket Codes'
      },
      shielding: {
        dbColumn: 'Shielding_Type',
        filterLabel: 'Shielding'
      },
      color: {
        dbColumn: 'jacket_color',
        filterLabel: 'Colors',
        filterType: 'color'
      },
      pairCount: {
        dbColumn: 'pair_count',
        filterLabel: 'Pair Counts'
      },
      conductorAwg: {
        dbColumn: 'conductor_awg',
        filterLabel: 'Conductor AWG'
      }
    }
  },

  fiber_connectors: {
    tableName: 'fiber_connectors',
    displayName: 'Fiber Connector',
    searchModule: () => import('@/search/fiberConnectors/fiberConnectorSearch'),
    aiKeywords: ['connector', 'connectors', 'lc', 'sc', 'st', 'fc', 'mtp', 'mpo', 'fiber connector'],
    requiredColumns: ['part_number', 'brand', 'short_description'],
    tablePrefix: 'conn',
    category: 'Connector',
    specialFields: {
      connectorType: {
        dbColumn: 'connector_type',
        filterLabel: 'Connector Types'
      },
      fiberType: {
        dbColumn: 'fiber_category',
        filterLabel: 'Fiber Types'
      },
      polish: {
        dbColumn: 'polish',
        filterLabel: 'Polish Types'
      },
      technology: {
        dbColumn: 'technology',
        filterLabel: 'Technology'
      },
      housingColor: {
        dbColumn: 'housing_color',
        filterLabel: 'Housing Colors',
        filterType: 'color'
      },
      bootColor: {
        dbColumn: 'boot_color',
        filterLabel: 'Boot Colors',
        filterType: 'color'
      }
    }
  },

  adapter_panels: {
    tableName: 'adapter_panels',
    displayName: 'Adapter Panel',
    searchModule: () => import('@/search/fiberadapterPanels/fiberadapterPanelSearch'),
    aiKeywords: ['panel', 'adapter panel', 'coupling', 'adapter', 'fiber panel'],
    requiredColumns: ['part_number', 'brand', 'short_description'],
    tablePrefix: 'panel',
    category: 'Panel',
    specialFields: {
      panelType: {
        dbColumn: 'panel_type',
        filterLabel: 'Panel Types'
      },
      connectorType: {
        dbColumn: 'connector_type',
        filterLabel: 'Connector Types'
      },
      fiberType: {
        dbColumn: 'fiber_category',
        filterLabel: 'Fiber Types'
      },
      adaptersPerPanel: {
        dbColumn: 'number_of_adapter_per_panel',
        filterLabel: 'Adapters per Panel'
      },
      adapterColor: {
        dbColumn: 'adapter_color',
        filterLabel: 'Adapter Colors',
        filterType: 'color'
      },
      terminationType: {
        dbColumn: 'termination_type',
        filterLabel: 'Termination Types'
      }
    }
  },

  rack_mount_fiber_enclosures: {
    tableName: 'rack_mount_fiber_enclosures',
    displayName: 'Rack Mount Fiber Enclosure',
    searchModule: () => import('@/search/fiberenclosure/rack_mount_fiber_enclosure_Search'),
    aiKeywords: ['enclosure', 'housing', 'rack mount', 'cabinet', 'cch-', 'fap-', '4ru', '2ru', '1ru', 'fiber enclosure', 'rack'],
    requiredColumns: ['part_number', 'brand', 'short_description'],
    tablePrefix: 'encl',
    category: 'Enclosure',
    specialFields: {
      rackUnits: {
        dbColumn: 'rack_units',
        filterLabel: 'Rack Units'
      },
      panelType: {
        dbColumn: 'panel_type',
        filterLabel: 'Panel Types'
      },
      panelCapacity: {
        dbColumn: 'accepts_number_of_connector_housing_panels',
        filterLabel: 'Panel Capacity'
      },
      environment: {
        dbColumn: 'environment',
        filterLabel: 'Environment'
      },
      color: {
        dbColumn: 'color',
        filterLabel: 'Colors',
        filterType: 'color'
      }
    }
  },

  wall_mount_fiber_enclosures: {
    tableName: 'wall_mount_fiber_enclosures',
    displayName: 'Wall Mount Fiber Enclosure',
    searchModule: () => import('@/search/fiberenclosure/wall_mount_fiber_enclosure_Search'),
    aiKeywords: ['wall mount', 'wallmount', 'wall-mount', 'wall enclosure', 'surface mount'],
    requiredColumns: ['part_number', 'brand', 'short_description'],
    tablePrefix: 'wall',
    category: 'Enclosure',
    specialFields: {
      mountType: {
        dbColumn: 'mount_type',
        filterLabel: 'Mount Types'
      },
      panelType: {
        dbColumn: 'panel_type',
        filterLabel: 'Panel Types'
      },
      material: {
        dbColumn: 'material',
        filterLabel: 'Materials'
      },
      environment: {
        dbColumn: 'environment',
        filterLabel: 'Environment'
      }
    }
  },

  fiber_optic_cable: {
    tableName: 'fiber_optic_cable',
    displayName: 'Fiber Optic Cable',
    searchModule: () => import('@/search/fiberCables/fiberCableSearch'),
    aiKeywords: ['fiber', 'fibre', 'om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode', 'strand'],
    requiredColumns: ['part_number', 'brand', 'short_description'],
    tablePrefix: 'fiber',
    category: 'Fiber Cable',
    specialFields: {
      fiberType: {
        dbColumn: 'fiber_type',
        filterLabel: 'Fiber Types'
      },
      fiberCount: {
        dbColumn: 'fiber_count',
        filterLabel: 'Fiber Count'
      },
      jacketRating: {
        dbColumn: 'jacket_rating',
        filterLabel: 'Jacket Ratings'
      },
      jacketColor: {
        dbColumn: 'jacket_color',
        filterLabel: 'Jacket Colors',
        filterType: 'color'
      }
    }
  },

  jack_modules: {
    tableName: 'jack_modules',
    displayName: 'Jack Module',
    searchModule: () => import('@/search/jackModules/jackModuleSearch'),
    aiKeywords: [
      'jack', 'jack module', 'keystone', 'keystone jack',
      'rj45', 'rj45 jack', 'ethernet jack', 'network jack',
      'data jack', 'wiring jack', 'connector module',
      'cat6a jack', 'cat6 jack', 'cat5e jack',
      'utp jack', 'stp jack', 'shielded jack',
      'mini-com', 'minicom', 'cj688', 'cj5e88', 'cj6x88'
    ],
    requiredColumns: ['part_number', 'brand', 'short_description'],
    tablePrefix: 'jack',
    category: 'Jack Module',
    specialFields: {
      categoryRating: {
        dbColumn: 'category_rating',
        filterLabel: 'Categories'
      },
      shielding: {
        dbColumn: 'shielding_type',
        filterLabel: 'Shielding'
      },
      color: {
        dbColumn: 'color',  // This is the jack color
        filterLabel: 'Jack Colors',
        filterType: 'color'
      },
      productLine: {
        dbColumn: 'product_line',
        filterLabel: 'Product Lines'
      },
      pairCount: {
        dbColumn: 'pair_count',
        filterLabel: 'Pair Counts'
      },
      installationTools: {
        dbColumn: 'installation_tools_required',
        filterLabel: 'Installation Tools'
      },
      compatibleFaceplates: {
        dbColumn: 'compatible_faceplates',
        filterLabel: 'Compatible Faceplates'
      }
    }
  }
}

// Helper function to get product type by table name
export const getProductTypeByTable = (tableName: string): ProductTypeConfig | undefined => {
  return Object.values(PRODUCT_TYPES).find(pt => pt.tableName === tableName)
}

// Helper function to get product type by AI keywords
export const getProductTypeByKeywords = (query: string): ProductTypeConfig | undefined => {
  const queryLower = query.toLowerCase()

  // Check each product type's keywords
  for (const [key, config] of Object.entries(PRODUCT_TYPES)) {
    const hasKeyword = config.aiKeywords.some(keyword =>
      queryLower.includes(keyword.toLowerCase())
    )
    if (hasKeyword) {
      return config
    }
  }

  return undefined
}

// Helper function to get all AI keywords
export const getAllAIKeywords = (): string[] => {
  const allKeywords: string[] = []
  Object.values(PRODUCT_TYPES).forEach(config => {
    allKeywords.push(...config.aiKeywords)
  })
  return [...new Set(allKeywords)] // Remove duplicates
}

// Export type for use in other files
export type ProductTypeName = keyof typeof PRODUCT_TYPES