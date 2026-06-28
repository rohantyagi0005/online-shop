const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Helper to generate unique order number
function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderNo = 'GS-';
  for (let i = 0; i < 6; i++) {
    orderNo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return orderNo;
}

// 1. Create Order (Authenticated Customer)
router.post('/', verifyToken, async (req, res) => {
  const { customer_name, customer_phone, pickup_date, pickup_time, payment_method, items } = req.body;

  if (!customer_name || !customer_phone || !pickup_date || !pickup_time || !payment_method || !items || items.length === 0) {
    return res.status(400).json({ message: "All order details and items are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const orderItems = [];

    // Verify stock and calculate total
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, name, price, discount_price, stock_quantity, is_hidden FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0 || products[0].is_hidden) {
        throw new Error(`Product "${item.product_name}" is no longer available.`);
      }

      const p = products[0];
      if (p.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${p.name}". Only ${p.stock_quantity} left.`);
      }

      // Decrement stock
      const newStock = p.stock_quantity - item.quantity;
      await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, p.id]);

      const itemPrice = p.discount_price !== null ? p.discount_price : p.price;
      totalAmount += parseFloat(itemPrice) * item.quantity;

      orderItems.push({
        product_id: p.id,
        product_name: p.name,
        price: itemPrice,
        quantity: item.quantity
      });
    }

    const orderNumber = generateOrderNumber();
    
    // QR Code data (contains order number and customer identifier)
    const qrCodeData = JSON.stringify({
      orderNumber,
      customerName: customer_name,
      total: totalAmount,
      pickupDate: pickup_date,
      pickupTime: pickup_time
    });

    // Create Order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, pickup_date, pickup_time, total_amount, payment_method, qr_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, req.user.id, customer_name, customer_phone, pickup_date, pickup_time, totalAmount, payment_method, qrCodeData]
    );

    const orderId = orderResult.insertId;

    // Create Order Items
    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.price, item.quantity]
      );
    }

    // Trigger notification for new order
    await connection.query(
      'INSERT INTO notifications (type, message) VALUES (?, ?)',
      ['new_order', `New pickup order ${orderNumber} placed by ${customer_name}. Total: $${totalAmount.toFixed(2)}`]
    );

    // If payment method is online, trigger mock payment notification
    if (payment_method === 'online') {
      await connection.query(
        'INSERT INTO notifications (type, message) VALUES (?, ?)',
        ['payment_received', `Payment received online for order ${orderNumber}.`]
      );
      // Auto mark as paid for simulation
      await connection.query(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        ['paid', orderId]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "Order placed successfully.",
      orderId,
      orderNumber,
      totalAmount
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ message: err.message || "Failed to process order." });
  } finally {
    connection.release();
  }
});

// 2. Get My Orders (Authenticated Customer)
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, 
              (SELECT GROUP_CONCAT(CONCAT(quantity, 'x ', product_name) SEPARATOR ', ') 
               FROM order_items WHERE order_id = o.id) as items_summary
       FROM orders o 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 3. Get All Orders (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  const { search, status, paymentStatus } = req.query;
  let query = `
    SELECT o.*, 
           (SELECT GROUP_CONCAT(CONCAT(quantity, 'x ', product_name) SEPARATOR '; ') 
            FROM order_items WHERE order_id = o.id) as items_summary
    FROM orders o`;
  const queryParams = [];
  const conditions = [];

  if (status && status !== 'All') {
    conditions.push('o.order_status = ?');
    queryParams.push(status);
  }

  if (paymentStatus && paymentStatus !== 'All') {
    conditions.push('o.payment_status = ?');
    queryParams.push(paymentStatus);
  }

  if (search) {
    conditions.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY o.created_at DESC';

  try {
    const [orders] = await pool.query(query, queryParams);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 4. Get Specific Order (Authenticated Customer or Admin)
router.get('/:id', verifyToken, async (req, res) => {
  const orderId = req.params.id;
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = orders[0];
    // Check access permissions
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    res.json({ order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 5. Update Order Status (Admin only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  const orderId = req.params.id;
  const { order_status, payment_status } = req.body;

  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = orders[0];
    const updates = [];
    const queryParams = [];

    if (order_status) {
      updates.push('order_status = ?');
      queryParams.push(order_status);

      // Handle stock return if cancelled
      if (order_status === 'cancelled' && order.order_status !== 'cancelled') {
        const [items] = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
          if (item.product_id) {
            await pool.query(
              'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );
          }
        }
      }
    }

    if (payment_status) {
      updates.push('payment_status = ?');
      queryParams.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No status field provided for update." });
    }

    queryParams.push(orderId);
    await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, queryParams);

    res.json({ message: "Order status updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
