const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'gift_shop';

async function initDB() {
  let connection;
  try {
    console.log(`Connecting to MySQL server at ${dbConfig.host}...`);
    connection = await mysql.createConnection(dbConfig);
    
    console.log(`Creating database ${dbName} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`Successfully selected database ${dbName}.`);

    // Create Tables
    console.log("Creating tables...");

    // 1. Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(50) PRIMARY KEY,
        value_text TEXT
      )
    `);

    // 2. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('customer', 'admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2),
        stock_quantity INT NOT NULL,
        is_hidden BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 4. Product Images Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 5. Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        user_id INT,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        pickup_date DATE NOT NULL,
        pickup_time TIME NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('cash', 'online') NOT NULL,
        payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
        order_status ENUM('pending', 'ready_for_pickup', 'collected', 'cancelled') DEFAULT 'pending',
        qr_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 6. Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(150) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // 7. Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Visitor Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitor_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45),
        visit_date DATE NOT NULL,
        visit_hour INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Tables created successfully.");

    // Seeding Default Settings
    console.log("Seeding default settings...");
    const defaultSettings = {
      shop_name: "Gift & Stationery Haven",
      shop_logo: "",
      shop_banner: "",
      theme_color: "#7b4dff",
      theme_color_secondary: "#00d4ff",
      contact_number: "+1 (555) 123-4567",
      whatsapp_number: "+1 (555) 123-4567",
      address: "123 Main Street, Suite A, Townsville, CA 90210",
      google_maps_link: "https://maps.google.com",
      shop_timings: "Monday - Saturday: 9:00 AM - 7:00 PM, Sunday: Closed",
      social_instagram: "https://instagram.com/gift_haven",
      social_facebook: "https://facebook.com/gifthaven",
      about_text: "We are your friendly local gift and stationery shop, offering high-quality supplies, unique toys, gorgeous cosmetics, and custom packing services.",
      terms_conditions: "All orders must be collected in-store during normal business hours. Unclaimed orders after 3 days of target pickup date may be cancelled and refunded.",
      privacy_policy: "We only collect data necessary to manage pickup orders and accounts. Your information is never sold or shared.",
    };

    for (const [key, val] of Object.entries(defaultSettings)) {
      await connection.query(
        `INSERT INTO settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = ?`,
        [key, val, val]
      );
    }

    // Seeding Categories
    console.log("Seeding default categories...");
    const categoriesList = ["Toys", "Gifts", "Stationery", "Cosmetics", "Makeup", "Packing Items", "School Supplies", "Festival Items"];
    await connection.query(
      `INSERT INTO settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = ?`,
      ['categories', categoriesList.join(','), categoriesList.join(',')]
    );

    // Seeding Admin Account
    console.log("Seeding default admin...");
    const adminEmail = 'admin@giftshop.com';
    const adminPassword = 'admin123';
    const hashedPW = await bcrypt.hash(adminPassword, 10);

    const [existingAdmin] = await connection.query(`SELECT id FROM users WHERE email = ?`, [adminEmail]);
    if (existingAdmin.length === 0) {
      await connection.query(
        `INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`,
        ['Admin Owner', adminEmail, hashedPW, '+15551234567', 'admin']
      );
      console.log(`Admin user seeded. Login: ${adminEmail} / password: ${adminPassword}`);
    } else {
      console.log("Admin user already exists. Skipping.");
    }

    // Seeding Sample Products
    const [existingProducts] = await connection.query(`SELECT COUNT(*) as count FROM products`);
    if (existingProducts[0].count === 0) {
      console.log("Seeding sample products...");
      const samples = [
        { name: "Premium Blue Fountain Pen", description: "Elegant refillable fountain pen with fine steel nib.", category: "Stationery", price: 14.99, discount_price: 12.99, stock: 15 },
        { name: "Classic Spiral Journal", description: "Hardcover, 160 lined pages, archival-quality paper.", category: "Stationery", price: 7.50, discount_price: null, stock: 3 },
        { name: "Plush Brown Teddy Bear", description: "Super soft, 12-inch high teddy bear with decorative ribbon.", category: "Toys", price: 19.99, discount_price: null, stock: 8 },
        { name: "Velvet Ribbon Pack (5-colors)", description: "High-quality ribbons for elegant gift wrapping.", category: "Packing Items", stock: 25, price: 5.00, discount_price: 3.99 },
        { name: "Matte Lipstick Set (Nude Edition)", description: "Long-lasting colors, set of 4 popular matte shades.", category: "Cosmetics", price: 29.99, discount_price: 24.99, stock: 6 },
        { name: "Acrylic Desktop Organizer", description: "Multi-compartment transparent stationery organizer.", category: "School Supplies", price: 12.00, discount_price: null, stock: 0 }
      ];

      for (const product of samples) {
        const [result] = await connection.query(
          `INSERT INTO products (name, description, category, price, discount_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)`,
          [product.name, product.description, product.category, product.price, product.discount_price, product.stock]
        );
        const productId = result.insertId;

        // Seed a placeholder image
        const imgUrl = `https://picsum.photos/400/400?random=${productId}`;
        await connection.query(
          `INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`,
          [productId, imgUrl]
        );
      }
      console.log("Sample products seeded.");
    } else {
      console.log("Products already exist in database. Skipping product seeding.");
    }

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDB();
