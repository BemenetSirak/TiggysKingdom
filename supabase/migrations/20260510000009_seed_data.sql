-- ── Products ──────────────────────────────────────────────────────────────────
INSERT INTO products (id, title, author, price, original_price, category, ages, stock, sold, rating, badge, active, created_at) VALUES
(1, 'Saint Yared: The Gift of Song',    'Maria Tesnaye',       14.99, 19.99, 'saint',   '5-8',  0,   186, 4.8, 'BESTSELLER', true, '2025-01-10T00:00:00Z'),
(2, 'Tiggy''s First Fast',              'Sarah Alemu',         12.99, NULL,  'story',   '4-7',  35,   43, 5.0, 'NEW',        true, '2025-02-15T00:00:00Z'),
(3, 'The Good Shepherd Coloring Book',  'Tiggy''s Kingdom',     9.99, NULL,  'coloring','4-10', 100,  89, 4.7, NULL,         true, '2025-01-20T00:00:00Z'),
(4, 'Saint Nicholas: Keeper of Hope',  'Fr. Daniel Yosef',    14.99, 17.99, 'saint',   '5-9',  1,   112, 4.9, NULL,         true, '2025-01-05T00:00:00Z'),
(5, 'The Holy Liturgy for Little Ones', 'Tiggy''s Kingdom',    11.99, NULL,  'prayer',  '3-8',  60,   67, 4.8, 'POPULAR',    true, '2025-02-01T00:00:00Z'),
(6, 'Advent Coloring Journey',          'Hana Tesfaye',         8.99, 12.99, 'coloring','5-12', 45,   34, 4.6, NULL,         true, '2025-03-01T00:00:00Z'),
(7, 'Saint Mary''s Story',             'Sister Miriam',        14.99, NULL,  'saint',   '4-8',  22,   28, 4.9, 'NEW',        true, '2025-04-01T00:00:00Z'),
(8, 'Faith Family Gift Bundle',         '4 books + activity set', 49.99, 69.99, 'gift', '4-12', 15,   21, 5.0, 'SAVE 28%',  true, '2025-03-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ── Episodes ──────────────────────────────────────────────────────────────────
INSERT INTO episodes (id, video_id, title, description, ages, category, featured, sort_order, active, created_at) VALUES
(1, '', 'Tiggy Learns to Pray',  'Tiggy discovers the power of prayer and teaches little ones the Morning Prayer.', '4-8',  'prayer',    true,  1, true, '2025-01-15T00:00:00Z'),
(2, '', 'The Good Shepherd',     'A gentle retelling of Psalm 23 through Tiggy''s adventures in the meadow.',      '3-7',  'scripture', true,  2, true, '2025-01-22T00:00:00Z'),
(3, '', 'Saint Yared''s Gift',   'How a young boy''s love for music became a gift to the whole church.',           '5-10', 'saints',    false, 3, true, '2025-02-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

SELECT setval('episodes_id_seq', (SELECT MAX(id) FROM episodes));

-- ── Subscribers ───────────────────────────────────────────────────────────────
INSERT INTO subscribers (id, email, name, source, active, created_at) VALUES
(1, 'maria@example.com', 'Maria S.', 'homepage',       false, '2025-01-15T10:00:00Z'),
(2, 'sara@example.com',  'Sara T.',  'subscribe-page', false, '2025-02-03T14:30:00Z'),
(3, 'hana@example.com',  'Hana M.', 'homepage',        false, '2025-02-18T09:15:00Z'),
(4, 'john@example.com',  'John K.', 'footer',          false, '2025-03-01T16:00:00Z'),
(5, 'david@example.com', 'David P.','subscribe-page',  false, '2025-04-10T11:45:00Z'),
(6, 'test@test.com',     '',        'homepage',        true,  '2026-05-08T21:09:47Z'),
(7, 'abc@123.com',       '',        'homepage',        true,  '2026-05-08T21:23:52Z')
ON CONFLICT (email) DO NOTHING;

SELECT setval('subscribers_id_seq', (SELECT MAX(id) FROM subscribers));

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, email, joined_date, created_at) VALUES
('1778111989470', 'Abc', 'admin@abc.com', '2026-05-06T23:59:49Z', '2026-05-06T23:59:49Z')
ON CONFLICT (id) DO NOTHING;

-- ── Orders ────────────────────────────────────────────────────────────────────
INSERT INTO orders (id, customer_name, customer_email, items, total, status, created_at) VALUES
('TK-2025-00001', 'Maria S.', 'maria@example.com', '[{"title":"Saint Yared: The Gift of Song","price":14.99,"quantity":1},{"title":"The Holy Liturgy for Little Ones","price":11.99,"quantity":1}]', 26.98, 'delivered', '2025-04-10T14:32:00Z'),
('TK-2025-00002', 'Sara T.',  'sara@example.com',  '[{"title":"Saint Yared: The Gift of Song","price":14.99,"quantity":2}]',                                                                       29.98, 'shipped',   '2025-04-28T09:15:00Z'),
('TK-2025-00003', 'John K.',  'john@example.com',  '[{"title":"Faith Family Gift Bundle","price":49.99,"quantity":1}]',                                                                             49.99, 'cancelled', '2025-05-01T16:45:00Z'),
('TK-2025-00004', 'Hana M.',  'hana@example.com',  '[{"title":"Tiggy''s First Fast","price":12.99,"quantity":1},{"title":"Advent Coloring Journey","price":8.99,"quantity":1}]',                  21.98, 'cancelled', '2025-04-22T11:00:00Z'),
('TK-2025-00005', 'David P.', 'david@example.com', '[{"title":"Saint Nicholas: Keeper of Hope","price":14.99,"quantity":1}]',                                                                      14.99, 'cancelled', '2025-05-05T08:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── Activity Log ──────────────────────────────────────────────────────────────
INSERT INTO activity_log (action, details, at) VALUES
('product_update', '{"id":1,"title":"Saint Yared: The Gift of Song"}', '2026-05-09T20:26:53Z')
ON CONFLICT DO NOTHING;
