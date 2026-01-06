-- =============================================
-- RESTAURANT BOT DATABASE SCHEMA
-- =============================================

-- Foods table (menu items)
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_wa_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    payment_method VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table (junction table)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_available ON foods(available);
CREATE INDEX IF NOT EXISTS idx_orders_user_wa_id ON orders(user_wa_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert food categories and items
INSERT INTO foods (name, description, price, category, image_url, available) VALUES
-- Momos
('Steamed Veg Momo', 'Fresh vegetables & herbs wrapped in soft dough, steamed to perfection', 180.00, 'momos', 'https://example.com/images/steamed-veg-momo.jpg', true),
('Steamed Chicken Momo', 'Juicy chicken filling in soft steamed dumplings', 220.00, 'momos', 'https://example.com/images/steamed-chicken-momo.jpg', true),
('Fried Veg Momo', 'Crispy fried vegetable momos with crunchy exterior', 200.00, 'momos', 'https://example.com/images/fried-veg-momo.jpg', true),
('Fried Chicken Momo', 'Golden fried chicken momos, crispy and delicious', 240.00, 'momos', 'https://example.com/images/fried-chicken-momo.jpg', true),
('Tandoori Momo', 'Momos grilled in tandoor with special spices', 260.00, 'momos', 'https://example.com/images/tandoori-momo.jpg', true),
('Jhol Momo', 'Steamed momos served in spicy soup gravy', 250.00, 'momos', 'https://example.com/images/jhol-momo.jpg', true),

-- Noodles
('Veg Thukpa', 'Traditional Tibetan noodle soup with vegetables', 200.00, 'noodles', 'https://example.com/images/veg-thukpa.jpg', true),
('Chicken Thukpa', 'Hearty noodle soup with tender chicken pieces', 250.00, 'noodles', 'https://example.com/images/chicken-thukpa.jpg', true),
('Veg Chowmein', 'Stir-fried noodles with fresh vegetables', 180.00, 'noodles', 'https://example.com/images/veg-chowmein.jpg', true),
('Chicken Chowmein', 'Stir-fried noodles with chicken and vegetables', 220.00, 'noodles', 'https://example.com/images/chicken-chowmein.jpg', true),
('Veg Chopsuey', 'Crispy noodles with vegetable gravy', 220.00, 'noodles', 'https://example.com/images/veg-chopsuey.jpg', true),

-- Rice Dishes
('Veg Fried Rice', 'Wok-tossed rice with mixed vegetables', 180.00, 'rice', 'https://example.com/images/veg-fried-rice.jpg', true),
('Chicken Fried Rice', 'Delicious fried rice with chicken pieces', 220.00, 'rice', 'https://example.com/images/chicken-fried-rice.jpg', true),
('Egg Fried Rice', 'Classic egg fried rice with vegetables', 190.00, 'rice', 'https://example.com/images/egg-fried-rice.jpg', true),
('Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 300.00, 'rice', 'https://example.com/images/chicken-biryani.jpg', true),

-- Beverages
('Masala Tea', 'Traditional spiced tea', 40.00, 'beverages', 'https://example.com/images/masala-tea.jpg', true),
('Coffee', 'Hot brewed coffee', 60.00, 'beverages', 'https://example.com/images/coffee.jpg', true),
('Fresh Lime Soda', 'Refreshing lime soda (sweet/salty)', 80.00, 'beverages', 'https://example.com/images/lime-soda.jpg', true),
('Mango Lassi', 'Creamy mango yogurt drink', 100.00, 'beverages', 'https://example.com/images/mango-lassi.jpg', true),
('Cold Coffee', 'Iced coffee with cream', 120.00, 'beverages', 'https://example.com/images/cold-coffee.jpg', true)

ON CONFLICT DO NOTHING;
