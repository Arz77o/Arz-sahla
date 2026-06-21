-- Add performance indexes for product details page and catalog query optimization
-- 1. Create index on reviews(product_id) to speed up reviews join on ProductDetail page load
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- 2. Create index on products(category_id) to speed up catalog queries filtered by collection
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
