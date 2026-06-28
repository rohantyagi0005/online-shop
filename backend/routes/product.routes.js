const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer Storage (local temp storage first)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Image file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure Cloudinary
let useCloudinary = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  useCloudinary = true;
}

// Upload file helper
async function uploadFileToService(file) {
  if (useCloudinary) {
    try {
      // Cloudinary compression and optimization preset
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'gift_shop_products',
        transformation: [
          { width: 800, crop: "limit" }, // limit width
          { quality: "auto:good" },     // automatic compression
          { fetch_format: "auto" }      // automatic format optimization
        ]
      });
      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to local:", err);
      // Fallback to local
      return '/uploads/' + file.filename;
    }
  } else {
    // Return local url
    return '/uploads/' + file.filename;
  }
}

// Get all products (Public filterable / Admin list)
router.get('/', async (req, res) => {
  const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12, includeHidden } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = 'SELECT p.*, GROUP_CONCAT(pi.image_url) as images FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id';
  const queryParams = [];
  const conditions = [];

  // Exclude hidden products for customers by default
  if (includeHidden !== 'true') {
    conditions.push('p.is_hidden = FALSE');
  }

  if (category && category !== 'All') {
    conditions.push('p.category = ?');
    queryParams.push(category);
  }

  if (search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice) {
    conditions.push('p.price >= ?');
    queryParams.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    conditions.push('p.price <= ?');
    queryParams.push(parseFloat(maxPrice));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY p.id';

  // Sorting
  if (sort === 'price_asc') {
    query += ' ORDER BY p.price ASC';
  } else if (sort === 'price_desc') {
    query += ' ORDER BY p.price DESC';
  } else if (sort === 'newest') {
    query += ' ORDER BY p.created_at DESC';
  } else {
    query += ' ORDER BY p.id DESC'; // default
  }

  query += ' LIMIT ? OFFSET ?';
  queryParams.push(parseInt(limit), offset);

  try {
    const [productsList] = await pool.query(query, queryParams);
    
    // Count total query
    let countQuery = 'SELECT COUNT(DISTINCT p.id) as count FROM products p';
    const countParams = [];
    const countConditions = [...conditions];
    
    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const [countResult] = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
    const totalItems = countResult[0].count;
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    // Format products image list
    const formattedProducts = productsList.map(p => ({
      ...p,
      images: p.images ? p.images.split(',') : []
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        totalItems,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get single product details + Similar products
router.get('/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const [productsList] = await pool.query(
      `SELECT p.*, GROUP_CONCAT(pi.image_url) as images 
       FROM products p 
       LEFT JOIN product_images pi ON p.id = pi.product_id 
       WHERE p.id = ? 
       GROUP BY p.id`, 
      [productId]
    );

    if (productsList.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    const product = productsList[0];
    product.images = product.images ? product.images.split(',') : [];

    // Track product view (simulation/logging for analytics)
    // We can increment a mock view counter or just log it. For simplicity we fetch similar products:
    const [similar] = await pool.query(
      `SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image 
       FROM products p 
       WHERE p.category = ? AND p.id != ? AND p.is_hidden = FALSE 
       LIMIT 4`,
      [product.category, productId]
    );

    res.json({
      product,
      similarProducts: similar
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Add Product (Admin only)
router.post('/', verifyToken, isAdmin, upload.array('images', 10), async (req, res) => {
  const { name, description, category, price, discount_price, stock_quantity, is_hidden } = req.body;
  
  if (!name || !category || !price || stock_quantity === undefined) {
    return res.status(400).json({ message: "Name, category, price, and stock are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, description, category, price, discount_price, stock_quantity, is_hidden) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description || '', 
        category, 
        parseFloat(price), 
        discount_price ? parseFloat(discount_price) : null, 
        parseInt(stock_quantity), 
        is_hidden === 'true' || is_hidden === true ? 1 : 0
      ]
    );
    const productId = result.insertId;

    // Handle Uploaded Images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadFileToService(file);
        await pool.query(
          `INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`,
          [productId, imageUrl]
        );
      }
    } else {
      // Default placeholder image
      await pool.query(
        `INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`,
        [productId, `https://picsum.photos/400/400?random=${productId}`]
      );
    }

    res.status(201).json({ message: "Product created successfully.", productId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Edit Product (Admin only)
router.put('/:id', verifyToken, isAdmin, upload.array('images', 10), async (req, res) => {
  const productId = req.params.id;
  const { name, description, category, price, discount_price, stock_quantity, is_hidden, delete_images } = req.body;

  if (!name || !category || !price || stock_quantity === undefined) {
    return res.status(400).json({ message: "Name, category, price, and stock are required." });
  }

  try {
    const [productCheck] = await pool.query('SELECT id, stock_quantity FROM products WHERE id = ?', [productId]);
    if (productCheck.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    const previousStock = productCheck[0].stock_quantity;
    const currentStock = parseInt(stock_quantity);

    // Update Product Details
    await pool.query(
      `UPDATE products 
       SET name = ?, description = ?, category = ?, price = ?, discount_price = ?, stock_quantity = ?, is_hidden = ? 
       WHERE id = ?`,
      [
        name, 
        description || '', 
        category, 
        parseFloat(price), 
        discount_price ? parseFloat(discount_price) : null, 
        currentStock, 
        is_hidden === 'true' || is_hidden === true ? 1 : 0, 
        productId
      ]
    );

    // Delete targeted images if requested
    if (delete_images) {
      const imagesToDelete = Array.isArray(delete_images) ? delete_images : [delete_images];
      for (const imgUrl of imagesToDelete) {
        await pool.query('DELETE FROM product_images WHERE product_id = ? AND image_url = ?', [productId, imgUrl]);
        // Note: For full completeness you would also delete locally or on Cloudinary,
        // but for local testing database cleanup is the primary requirement.
      }
    }

    // Add newly uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadFileToService(file);
        await pool.query(
          `INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`,
          [productId, imageUrl]
        );
      }
    }

    // Check for Low Stock / Out of Stock alerts
    if (currentStock === 0 && previousStock > 0) {
      await pool.query(
        'INSERT INTO notifications (type, message) VALUES (?, ?)',
        ['out_of_stock', `Product "${name}" is now out of stock!`]
      );
    } else if (currentStock <= 5 && currentStock > 0 && previousStock > 5) {
      await pool.query(
        'INSERT INTO notifications (type, message) VALUES (?, ?)',
        ['low_stock', `Product "${name}" has low stock (${currentStock} left).`]
      );
    }

    res.json({ message: "Product updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Delete Product (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const productId = req.params.id;
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Duplicate Product (Admin only)
router.post('/:id/duplicate', verifyToken, isAdmin, async (req, res) => {
  const productId = req.params.id;
  try {
    const [productsList] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (productsList.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    const p = productsList[0];
    // Create new duplicated product
    const [result] = await pool.query(
      `INSERT INTO products (name, description, category, price, discount_price, stock_quantity, is_hidden) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`${p.name} (Copy)`, p.description, p.category, p.price, p.discount_price, p.stock_quantity, p.is_hidden]
    );
    const newId = result.insertId;

    // Duplicate images
    const [images] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [productId]);
    for (const img of images) {
      await pool.query(
        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
        [newId, img.image_url]
      );
    }

    res.status(201).json({ message: "Product duplicated successfully.", duplicatedId: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Bulk Stock Update (Admin only)
router.put('/bulk/stock', verifyToken, isAdmin, async (req, res) => {
  const { updates } = req.body; // Array of { id, stock }
  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ message: "Invalid updates format. Array of { id, stock } expected." });
  }

  try {
    for (const item of updates) {
      const { id, stock } = item;
      if (id && stock !== undefined) {
        await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [parseInt(stock), id]);
      }
    }
    res.json({ message: "Bulk stock updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
