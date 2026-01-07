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
('Steamed Veg Momo', 'Fresh vegetables & herbs wrapped in soft dough, steamed to perfection', 180.00, 'momos', 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&q=80', true),
('Steamed Chicken Momo', 'Juicy chicken filling in soft steamed dumplings', 220.00, 'momos', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80', true),
('Fried Veg Momo', 'Crispy fried vegetable momos with crunchy exterior', 200.00, 'momos', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80', true),
('Fried Chicken Momo', 'Golden fried chicken momos, crispy and delicious', 240.00, 'momos', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80', true),
('Tandoori Momo', 'Momos grilled in tandoor with special spices', 260.00, 'momos', 'https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=400&q=80', true),
('Jhol Momo', 'Steamed momos served in spicy soup gravy', 250.00, 'momos', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80', true),

-- Noodles
('Veg Thukpa', 'Traditional Tibetan noodle soup with vegetables', 200.00, 'noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', true),
('Chicken Thukpa', 'Hearty noodle soup with tender chicken pieces', 250.00, 'noodles', 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=400&q=80', true),
('Veg Chowmein', 'Stir-fried noodles with fresh vegetables', 180.00, 'noodles', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80', true),
('Chicken Chowmein', 'Stir-fried noodles with chicken and vegetables', 220.00, 'noodles', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&q=80', true),
('Veg Chopsuey', 'Crispy noodles with vegetable gravy', 220.00, 'noodles', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80', true),

-- Rice Dishes
('Veg Fried Rice', 'Wok-tossed rice with mixed vegetables', 180.00, 'rice', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', true),
('Chicken Fried Rice', 'Delicious fried rice with chicken pieces', 220.00, 'rice', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', true),
('Egg Fried Rice', 'Classic egg fried rice with vegetables', 190.00, 'rice', 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&q=80', true),
('Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 300.00, 'rice', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', true),

-- Beverages
('Masala Tea', 'Traditional spiced tea', 40.00, 'beverages', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80', true),
('Coffee', 'Hot brewed coffee', 60.00, 'beverages', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', true),
('Fresh Lime Soda', 'Refreshing lime soda (sweet/salty)', 80.00, 'beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', true),
('Mango Lassi', 'Creamy mango yogurt drink', 100.00, 'beverages', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80', true),
('Cold Coffee', 'Iced coffee with cream', 120.00, 'beverages', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', true)

ON CONFLICT DO NOTHING;
