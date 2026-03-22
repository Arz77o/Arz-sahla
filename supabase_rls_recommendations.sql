-- Recommended RLS Policies for Sahla DZ

-- 1. Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 2. Products Table
-- Public can only see published products
CREATE POLICY "Public can view published products" ON products
  FOR SELECT USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins have full access to products" ON products
  TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- 3. Categories Table
-- Public can view all categories
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "Admins have full access to categories" ON categories
  TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- 4. Orders Table
-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all orders
CREATE POLICY "Admins have full access to orders" ON orders
  TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- 5. Order Items Table
-- Users can view their own order items
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to order_items" ON order_items
  TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- 6. Settings Table
-- Public can read settings
CREATE POLICY "Public can read settings" ON settings
  FOR SELECT USING (true);

-- Admins can update settings
CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- 7. Reviews Table
-- Public can read all reviews
CREATE POLICY "Public can read reviews" ON reviews
  FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can delete or update reviews
CREATE POLICY "Admins can manage reviews" ON reviews
  TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
