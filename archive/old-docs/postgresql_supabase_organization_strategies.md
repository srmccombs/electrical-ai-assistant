# PostgreSQL/Supabase Organization Strategies for Enterprise Electrical Distribution System

## Table of Contents
1. [PostgreSQL Schema Architecture](#postgresql-schema-architecture)
2. [Table Naming Conventions](#table-naming-conventions)
3. [View Strategies](#view-strategies)
4. [Enterprise Best Practices](#enterprise-best-practices)
5. [Electrical Product Catalog Recommendations](#electrical-product-catalog-recommendations)

## PostgreSQL Schema Architecture

### 1. Schema-Based Logical Separation

For an enterprise electrical distribution system, implement a multi-schema architecture:

```sql
-- Core business schemas
CREATE SCHEMA IF NOT EXISTS catalog;      -- Product catalog and specifications
CREATE SCHEMA IF NOT EXISTS inventory;    -- Stock levels and warehouse management
CREATE SCHEMA IF NOT EXISTS sales;        -- Customer orders and transactions
CREATE SCHEMA IF NOT EXISTS analytics;    -- Reporting and business intelligence
CREATE SCHEMA IF NOT EXISTS operations;   -- Operational data and workflows

-- Supporting schemas
CREATE SCHEMA IF NOT EXISTS auth_custom;  -- Extended authentication/authorization
CREATE SCHEMA IF NOT EXISTS audit;        -- Audit logs and compliance
CREATE SCHEMA IF NOT EXISTS staging;      -- Data import/export staging
```

### 2. Schema Usage Guidelines

- **catalog**: Core product information, manufacturers, categories, specifications
- **inventory**: Real-time stock levels, warehouse locations, reorder points
- **sales**: Orders, quotes, invoices, customer relationships
- **analytics**: Materialized views, aggregated data, reporting structures
- **operations**: Shipping, receiving, quality control, RMA processes

### 3. Multi-Tenant Considerations

For enterprise electrical distribution with multiple branches or divisions:

```sql
-- Shared table approach with tenant discriminator
ALTER TABLE catalog.products ADD COLUMN branch_id UUID NOT NULL;
ALTER TABLE inventory.stock_levels ADD COLUMN branch_id UUID NOT NULL;
ALTER TABLE sales.orders ADD COLUMN branch_id UUID NOT NULL;

-- Create indexes on tenant discriminator
CREATE INDEX idx_products_branch ON catalog.products(branch_id);
CREATE INDEX idx_stock_branch ON inventory.stock_levels(branch_id);
CREATE INDEX idx_orders_branch ON sales.orders(branch_id);
```

## Table Naming Conventions

### 1. Core Naming Standards

**Use snake_case exclusively** for all database objects:

```sql
-- Good naming examples
CREATE TABLE catalog.products (...)
CREATE TABLE catalog.product_categories (...)
CREATE TABLE catalog.manufacturer_products (...)
CREATE TABLE inventory.stock_levels (...)
CREATE TABLE inventory.warehouse_locations (...)

-- Avoid these patterns
-- tbl_products (Hungarian notation)
-- Products (PascalCase)
-- productCategories (camelCase)
```

### 2. Specific Naming Patterns

#### Tables
- Use plural nouns: `products`, `categories`, `orders`
- Junction tables: `{table1}_{table2}` (e.g., `product_categories`)
- Hierarchical data: `{parent}_{child}` (e.g., `category_subcategories`)

#### Columns
- Primary keys: `id` (UUID preferred for distributed systems)
- Foreign keys: `{referenced_table_singular}_id` (e.g., `product_id`, `category_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Status fields: `is_active`, `is_deleted`, `is_published`
- Quantities: `quantity_on_hand`, `quantity_available`, `quantity_reserved`

#### Indexes
```sql
-- Primary key index (automatic)
-- Foreign key indexes
CREATE INDEX idx_products_manufacturer_id ON catalog.products(manufacturer_id);
CREATE INDEX idx_products_category_id ON catalog.products(category_id);

-- Search optimization indexes
CREATE INDEX idx_products_sku ON catalog.products(sku);
CREATE INDEX idx_products_search ON catalog.products USING gin(to_tsvector('english', name || ' ' || description));

-- Composite indexes for common queries
CREATE INDEX idx_stock_product_warehouse ON inventory.stock_levels(product_id, warehouse_id);
```

## View Strategies

### 1. Standard Views for API Layer

```sql
-- Product catalog view with enriched data
CREATE VIEW catalog.v_products_enriched AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.description,
    p.list_price,
    c.name as category_name,
    c.path as category_path,
    m.name as manufacturer_name,
    COALESCE(s.quantity_available, 0) as stock_available,
    COALESCE(s.quantity_on_hand, 0) as stock_on_hand
FROM catalog.products p
LEFT JOIN catalog.categories c ON p.category_id = c.id
LEFT JOIN catalog.manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN inventory.stock_levels s ON p.id = s.product_id
WHERE p.is_active = true;

-- Set security invoker for RLS compliance (Postgres 15+)
ALTER VIEW catalog.v_products_enriched SET (security_invoker = true);
```

### 2. Materialized Views for Performance

```sql
-- Category aggregation for navigation
CREATE MATERIALIZED VIEW analytics.mv_category_stats AS
SELECT 
    c.id,
    c.name,
    c.path,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT p.manufacturer_id) as manufacturer_count,
    AVG(p.list_price) as avg_price,
    MIN(p.list_price) as min_price,
    MAX(p.list_price) as max_price,
    SUM(COALESCE(s.quantity_available, 0)) as total_stock
FROM catalog.categories c
LEFT JOIN catalog.products p ON p.category_id = c.id AND p.is_active = true
LEFT JOIN inventory.stock_levels s ON s.product_id = p.id
GROUP BY c.id, c.name, c.path;

-- Create indexes on materialized view
CREATE INDEX idx_mv_category_stats_id ON analytics.mv_category_stats(id);
CREATE INDEX idx_mv_category_stats_path ON analytics.mv_category_stats(path);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_category_stats;
```

### 3. Search Optimization Views

```sql
-- Full-text search materialized view
CREATE MATERIALIZED VIEW catalog.mv_product_search AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.description,
    to_tsvector('english', 
        p.name || ' ' || 
        COALESCE(p.description, '') || ' ' || 
        p.sku || ' ' || 
        COALESCE(m.name, '') || ' ' ||
        COALESCE(c.name, '')
    ) as search_vector,
    p.list_price,
    p.category_id,
    p.manufacturer_id
FROM catalog.products p
LEFT JOIN catalog.manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN catalog.categories c ON p.category_id = c.id
WHERE p.is_active = true;

-- Create GIN index for full-text search
CREATE INDEX idx_product_search_vector ON catalog.mv_product_search USING gin(search_vector);
```

## Enterprise Best Practices

### 1. Row Level Security (RLS) Implementation

```sql
-- Enable RLS on all tables
ALTER TABLE catalog.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;

-- Branch-based access policy
CREATE POLICY branch_isolation ON catalog.products
    FOR ALL
    TO authenticated
    USING (branch_id IN (
        SELECT branch_id 
        FROM auth_custom.user_branches 
        WHERE user_id = auth.uid()
    ));

-- Role-based access for inventory
CREATE POLICY inventory_read ON inventory.stock_levels
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY inventory_write ON inventory.stock_levels
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM auth_custom.user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('inventory_manager', 'admin')
        )
    );
```

### 2. Audit and Compliance

```sql
-- Audit trigger function
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.change_log (
        table_schema,
        table_name,
        operation,
        user_id,
        changed_at,
        old_data,
        new_data
    ) VALUES (
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        NOW(),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_products 
    AFTER INSERT OR UPDATE OR DELETE ON catalog.products
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

### 3. Performance Optimization

```sql
-- Partitioning for large tables (orders by date)
CREATE TABLE sales.orders (
    id UUID DEFAULT gen_random_uuid(),
    order_date TIMESTAMP NOT NULL,
    customer_id UUID NOT NULL,
    total_amount DECIMAL(10,2),
    -- other columns
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

-- Create monthly partitions
CREATE TABLE sales.orders_2024_01 PARTITION OF sales.orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automated partition management
CREATE OR REPLACE FUNCTION sales.create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
    end_date := start_date + interval '1 month';
    partition_name := 'orders_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS sales.%I PARTITION OF sales.orders FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

## Electrical Product Catalog Recommendations

### 1. Core Product Tables

```sql
-- Manufacturers table
CREATE TABLE catalog.manufacturers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product categories with hierarchical structure
CREATE TABLE catalog.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES catalog.categories(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    path LTREE NOT NULL, -- For hierarchical queries
    level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Main products table
CREATE TABLE catalog.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    manufacturer_id UUID NOT NULL REFERENCES catalog.manufacturers(id),
    category_id UUID NOT NULL REFERENCES catalog.categories(id),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    upc_code VARCHAR(50),
    manufacturer_part_number VARCHAR(100),
    
    -- Electrical specific fields
    voltage_rating VARCHAR(50),
    amperage_rating VARCHAR(50),
    wattage VARCHAR(50),
    phase VARCHAR(20),
    frequency VARCHAR(20),
    
    -- Physical attributes
    weight_lbs DECIMAL(10,3),
    length_in DECIMAL(10,3),
    width_in DECIMAL(10,3),
    height_in DECIMAL(10,3),
    
    -- Pricing
    list_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_discontinued BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product specifications (EAV pattern for flexibility)
CREATE TABLE catalog.product_specifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    spec_name VARCHAR(255) NOT NULL,
    spec_value TEXT,
    spec_unit VARCHAR(50),
    spec_type VARCHAR(50), -- 'electrical', 'physical', 'environmental', etc.
    display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_product_specs_product ON catalog.product_specifications(product_id);
CREATE INDEX idx_product_specs_type ON catalog.product_specifications(spec_type);
```

### 2. Inventory Management Tables

```sql
-- Warehouse locations
CREATE TABLE inventory.warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Stock levels with location tracking
CREATE TABLE inventory.stock_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    location_code VARCHAR(50), -- Aisle/Bin location
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    last_counted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id, location_code)
);

-- Stock movements for tracking
CREATE TABLE inventory.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    movement_type VARCHAR(50) NOT NULL, -- 'receipt', 'shipment', 'adjustment', 'transfer'
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'po', 'rma', 'manual'
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Search and Analytics Tables

```sql
-- Popular searches tracking
CREATE TABLE analytics.search_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_text TEXT NOT NULL,
    results_count INTEGER,
    user_id UUID,
    session_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product view tracking
CREATE TABLE analytics.product_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    user_id UUID,
    session_id UUID,
    source VARCHAR(50), -- 'search', 'category', 'direct', etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sales analytics summary (materialized view)
CREATE MATERIALIZED VIEW analytics.mv_product_sales_summary AS
SELECT 
    p.id as product_id,
    p.sku,
    p.name,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.line_total) as total_revenue,
    AVG(oi.unit_price) as avg_selling_price,
    MAX(o.order_date) as last_sold_date
FROM catalog.products p
LEFT JOIN sales.order_items oi ON p.id = oi.product_id
LEFT JOIN sales.orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY p.id, p.sku, p.name;
```

### 4. Operational Tables

```sql
-- Customer pricing tiers
CREATE TABLE operations.customer_pricing_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    product_id UUID REFERENCES catalog.products(id),
    category_id UUID REFERENCES catalog.categories(id),
    discount_percentage DECIMAL(5,2),
    fixed_price DECIMAL(10,2),
    min_quantity INTEGER DEFAULT 1,
    valid_from DATE,
    valid_to DATE,
    CONSTRAINT check_product_or_category CHECK (
        (product_id IS NOT NULL AND category_id IS NULL) OR
        (product_id IS NULL AND category_id IS NOT NULL)
    )
);

-- Quote management
CREATE TABLE operations.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    salesperson_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quote items
CREATE TABLE operations.quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES operations.quotes(id),
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL
);
```

### 5. Performance Optimization Strategies

#### Indexing Strategy
```sql
-- Full-text search optimization
CREATE INDEX idx_products_search_gin ON catalog.products 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Category path queries
CREATE INDEX idx_categories_path ON catalog.categories USING gist(path);

-- Stock level queries
CREATE INDEX idx_stock_product_warehouse ON inventory.stock_levels(product_id, warehouse_id);
CREATE INDEX idx_stock_available ON inventory.stock_levels(quantity_available) 
    WHERE quantity_available > 0;

-- Common filtering
CREATE INDEX idx_products_active_category ON catalog.products(category_id) 
    WHERE is_active = true;
CREATE INDEX idx_products_manufacturer_active ON catalog.products(manufacturer_id) 
    WHERE is_active = true;
```

#### Query Optimization Views
```sql
-- Product availability view
CREATE VIEW catalog.v_products_available AS
SELECT 
    p.*,
    COALESCE(SUM(s.quantity_available), 0) as total_stock,
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'warehouse_id', w.id,
            'warehouse_name', w.name,
            'quantity', s.quantity_available
        )
    ) FILTER (WHERE s.quantity_available > 0) as stock_locations
FROM catalog.products p
LEFT JOIN inventory.stock_levels s ON p.id = s.product_id
LEFT JOIN inventory.warehouses w ON s.warehouse_id = w.id
WHERE p.is_active = true
GROUP BY p.id;

-- Category navigation with counts
CREATE MATERIALIZED VIEW catalog.mv_category_navigation AS
WITH RECURSIVE category_tree AS (
    SELECT 
        c.id,
        c.parent_id,
        c.name,
        c.path,
        c.level,
        COUNT(DISTINCT p.id) as direct_product_count
    FROM catalog.categories c
    LEFT JOIN catalog.products p ON p.category_id = c.id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.parent_id, c.name, c.path, c.level
)
SELECT 
    ct.*,
    (
        SELECT COUNT(DISTINCT p.id)
        FROM catalog.products p
        JOIN catalog.categories sub ON p.category_id = sub.id
        WHERE sub.path <@ ct.path AND p.is_active = true
    ) as total_product_count
FROM category_tree ct;

-- Refresh strategy for materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_category_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_product_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY catalog.mv_category_navigation;
    REFRESH MATERIALIZED VIEW CONCURRENTLY catalog.mv_product_search;
END;
$$ LANGUAGE plpgsql;
```

### 6. Supabase-Specific Configurations

#### RLS Policies for Multi-Branch Access
```sql
-- Function to check user branch access
CREATE OR REPLACE FUNCTION auth_custom.user_has_branch_access(branch_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth_custom.user_branches 
        WHERE user_id = auth.uid() 
        AND branch_id = branch_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply RLS policies
CREATE POLICY products_branch_access ON catalog.products
    FOR ALL
    TO authenticated
    USING (auth_custom.user_has_branch_access(branch_id));

CREATE POLICY stock_branch_access ON inventory.stock_levels
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM catalog.products p 
            WHERE p.id = product_id 
            AND auth_custom.user_has_branch_access(p.branch_id)
        )
    );
```

#### API Integration Views
```sql
-- Simplified product API view
CREATE VIEW api.products AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.description,
    p.list_price,
    p.manufacturer_part_number,
    jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'code', m.code
    ) as manufacturer,
    jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'path', c.path::text
    ) as category,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'name', ps.spec_name,
                'value', ps.spec_value,
                'unit', ps.spec_unit,
                'type', ps.spec_type
            ) ORDER BY ps.display_order
        ) FILTER (WHERE ps.id IS NOT NULL),
        '[]'::jsonb
    ) as specifications
FROM catalog.products p
JOIN catalog.manufacturers m ON p.manufacturer_id = m.id
JOIN catalog.categories c ON p.category_id = c.id
LEFT JOIN catalog.product_specifications ps ON p.id = ps.product_id
WHERE p.is_active = true
GROUP BY p.id, m.id, m.name, m.code, c.id, c.name, c.path;

-- Grant access to API views
GRANT SELECT ON api.products TO anon, authenticated;
```

## Summary

This comprehensive strategy provides:

1. **Clear schema separation** for different business domains
2. **Consistent naming conventions** using snake_case throughout
3. **Optimized view strategies** with both standard and materialized views
4. **Enterprise-grade security** with RLS and audit trails
5. **Electrical industry-specific** product catalog design with proper indexing and search capabilities

The architecture supports scalability, maintainability, and performance while following PostgreSQL and Supabase best practices.