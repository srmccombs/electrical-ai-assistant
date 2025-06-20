# Database Table Documentation & Renaming Plan

## Table Analysis Summary
- **Total Tables**: 46 (40 base tables, 6 views)
- **Product Tables**: 9
- **Search/AI Tables**: 8
- **Analytics Tables**: 3
- **Operational Tables**: 11
- **Import/Temp Tables**: 3
- **Views**: 6
- **Unknown/Review**: 6

## Detailed Table Analysis

### 🟢 KEEP - Product Tables (Rename with `prod_` prefix)

| Current Name | New Name | Purpose | Status |
|--------------|----------|---------|---------|
| category_cables | prod_category_cables | Ethernet cables (Cat5e, Cat6, Cat6a) | ✅ Active |
| fiber_connectors | prod_fiber_connectors | LC, SC, ST fiber connectors | ✅ Active |
| fiber_optic_cable | prod_fiber_cables | Single/multimode fiber cables | ✅ Active |
| jack_modules | prod_jack_modules | RJ45 keystone jacks | ✅ Active |
| faceplates | prod_faceplates | Wall plates for jacks | ✅ Active |
| surface_mount_box | prod_surface_mount_boxes | Surface mount boxes (SMB) | ✅ Active |
| adapter_panels | prod_adapter_panels | Fiber adapter panels | ✅ Active |
| rack_mount_fiber_enclosures | prod_rack_mount_enclosures | Rack mount fiber enclosures | ✅ Active |
| wall_mount_fiber_enclosures | prod_wall_mount_enclosures | Wall mount fiber enclosures | ✅ Active |
| modular_plugs | prod_modular_plugs | RJ45 plugs/connectors | ❓ Check if active |

### 🟢 KEEP - Search & AI Tables (Rename with `search_` prefix)

| Current Name | New Name | Purpose | Status |
|--------------|----------|---------|---------|
| search_analytics | search_analytics | Track all searches | ✅ Active |
| search_feedback | search_feedback | User feedback on failed searches | ✅ Active |
| search_variations | search_variations | Search term variations/synonyms | ❓ May duplicate search_terms |
| search_decisions_audit | search_decisions_audit | Decision engine audit trail | ✅ Active |
| shadow_mode_comparisons | search_shadow_comparisons | Shadow mode testing results | ✅ Active |
| knowledge_contributions | search_knowledge_contrib | User-contributed search knowledge | ✅ Active |
| regression_tests | search_regression_tests | Search regression test cases | ✅ Active |
| prompts | search_ai_prompts | AI prompt templates | ❓ Check usage |

### 🟢 KEEP - Analytics Tables (Already prefixed)

| Current Name | New Name | Purpose | Status |
|--------------|----------|---------|---------|
| popular_searches | analytics_popular_searches | Most searched terms | ✅ View |
| search_analytics_summary | analytics_search_summary | Daily search aggregates | ✅ View |
| performance_baselines | analytics_performance | Performance benchmarks | ❓ Check usage |

### 🟢 KEEP - Operational Tables (Rename with `ops_` prefix)

| Current Name | New Name | Purpose | Status |
|--------------|----------|---------|---------|
| branch_locations | ops_branch_locations | Physical store locations | ✅ Active |
| location_types | ops_location_types | Types of locations | ✅ Active |
| manufacturers | ops_manufacturers | Product manufacturers | ✅ Active |
| distributors | ops_distributors | Product distributors | ✅ Active |
| distributor_inventory | ops_distributor_inventory | Distributor stock levels | ❓ Check if used |
| mayer_stock | ops_mayer_stock | Specific distributor inventory | ✅ Active |
| customer_product_lists | ops_customer_lists | Saved customer lists | ❓ Check if implemented |
| customer_list_items | ops_customer_list_items | Items in customer lists | ❓ Check if implemented |
| selection_sessions | ops_selection_sessions | User selection tracking | ❓ Check if implemented |

### 🟡 REVIEW - May Need Different Approach

| Current Name | Purpose | Recommendation |
|--------------|---------|----------------|
| products | Generic products table | ❓ Check if needed with typed tables |
| categories | Product categories | ❓ May not need with specific tables |
| product_attributes | EAV attributes | ❓ Check if used |
| compatible_products | Product compatibility | ❓ May duplicate jack/faceplate logic |
| go_with_items | Related products | ❓ Check if implemented |

### 🔴 DELETE - Import/Temporary Tables

| Current Name | Purpose | Recommendation |
|--------------|---------|----------------|
| cutsheet_import_temp | Temporary import table | 🗑️ Delete if not actively used |
| import_batches | Import tracking | ❓ Keep if doing regular imports |

### 🟢 KEEP - Documentation Tables (Rename with `docs_` prefix)

| Current Name | New Name | Purpose |
|--------------|----------|---------|
| product_datasheets | docs_product_datasheets | PDF datasheet info |
| product_datasheet_links | docs_datasheet_links | Links to datasheets |

### 📊 Views (Rename with `view_` prefix)

| Current Name | New Name | Purpose |
|--------------|----------|---------|
| product_search | view_product_search | Unified product search |
| v_products_complete | view_products_complete | Complete product info |
| v_mayer_stock_summary | view_mayer_stock_summary | Mayer inventory summary |
| products_without_cutsheets | view_missing_datasheets | Products needing datasheets |
| weekly_missing_cutsheets | view_weekly_missing_docs | Weekly missing docs report |
| weekly_missing_cutsheets_with_url | view_weekly_missing_docs_urls | With URLs |

## 🚨 Immediate Actions Needed

### Tables to Delete (Likely Unused)
1. `cutsheet_import_temp` - Temporary import table
2. `product_attributes` - If not using EAV pattern
3. `categories` - If using specific product tables
4. `compatible_products` - If duplicating jack/faceplate logic

### Tables Needing Investigation
1. `products` - Is this used or just legacy?
2. `go_with_items` - Is this feature implemented?
3. `customer_product_lists` & `customer_list_items` - Are these used?
4. `distributor_inventory` - Active or replaced by mayer_stock?
5. `prompts` - Used for AI or obsolete?

## Renaming Impact on Application

### High Impact (Used in search code):
- `category_cables` → `prod_category_cables`
- `fiber_connectors` → `prod_fiber_connectors`
- `jack_modules` → `prod_jack_modules`
- `faceplates` → `prod_faceplates`
- `surface_mount_box` → `prod_surface_mount_boxes`

### Medium Impact (Used in analytics/admin):
- `search_analytics` → Keep as-is
- `popular_searches` → `analytics_popular_searches`

### Low Impact (Backend only):
- Most operational tables
- Import tables
- Documentation tables