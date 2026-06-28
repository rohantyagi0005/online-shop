const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// 1. Log Visitor (Public)
router.post('/visitors/log', async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const visitDate = new Date().toISOString().split('T')[0];
  const visitHour = new Date().getHours();

  try {
    // Check if this IP already visited today to prevent double counting visitors (visitors vs hits)
    const [existing] = await pool.query(
      'SELECT id FROM visitor_logs WHERE ip_address = ? AND visit_date = ? LIMIT 1',
      [ip, visitDate]
    );

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO visitor_logs (ip_address, visit_date, visit_hour) VALUES (?, ?, ?)',
        [ip, visitDate, visitHour]
      );
    }
    res.status(204).end();
  } catch (err) {
    console.error("Error logging visitor:", err);
    res.status(500).json({ message: "Error logging visitor." });
  }
});

// 2. Fetch Notifications (Admin only)
router.get('/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 3. Mark Notifications Read (Admin only)
router.put('/notifications/read-all', verifyToken, isAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE');
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 4. Dashboard KPIs (Admin only)
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Total & Today Visitors
    const [[{ total_visitors }]] = await pool.query('SELECT COUNT(*) as total_visitors FROM visitor_logs');
    const [[{ today_visitors }]] = await pool.query('SELECT COUNT(*) as today_visitors FROM visitor_logs WHERE visit_date = ?', [today]);
    
    // Active visitors (mock active sessions - random number between 1 and 6 for local demo)
    const active_visitors = Math.floor(Math.random() * 5) + 1;

    // Total orders summary
    const [[{ total_orders }]] = await pool.query('SELECT COUNT(*) as total_orders FROM orders');
    const [[{ pending_orders }]] = await pool.query("SELECT COUNT(*) as pending_orders FROM orders WHERE order_status = 'pending'");
    const [[{ paid_orders }]] = await pool.query("SELECT COUNT(*) as paid_orders FROM orders WHERE payment_status = 'paid'");
    const [[{ cancelled_orders }]] = await pool.query("SELECT COUNT(*) as cancelled_orders FROM orders WHERE order_status = 'cancelled'");

    // Total Revenue (Only sum PAID orders)
    const [[{ total_revenue }]] = await pool.query("SELECT SUM(total_amount) as total_revenue FROM orders WHERE payment_status = 'paid'");
    const revenue = parseFloat(total_revenue || 0);

    // Sales breakdowns
    // Daily Sales (Today)
    const [[{ daily_sales }]] = await pool.query(
      "SELECT SUM(total_amount) as daily_sales FROM orders WHERE DATE(created_at) = ? AND payment_status = 'paid'",
      [today]
    );

    // Weekly Sales (Last 7 days)
    const [[{ weekly_sales }]] = await pool.query(
      "SELECT SUM(total_amount) as weekly_sales FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND payment_status = 'paid'"
    );

    // Monthly Sales (Last 30 days)
    const [[{ monthly_sales }]] = await pool.query(
      "SELECT SUM(total_amount) as monthly_sales FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND payment_status = 'paid'"
    );

    // Inventory Value (sum price * stock for all items)
    const [[{ inventory_val }]] = await pool.query('SELECT SUM(price * stock_quantity) as inventory_val FROM products WHERE is_hidden = FALSE');
    const inventory_value = parseFloat(inventory_val || 0);

    // Count product views (simulation: calculate sum of all stock or custom value)
    const [[{ total_views }]] = await pool.query('SELECT SUM(id * 3) as total_views FROM products'); // dummy views metric

    res.json({
      visitors: {
        total: total_visitors,
        today: today_visitors,
        active: active_visitors
      },
      views: total_views || 0,
      orders: {
        total: total_orders,
        pending: pending_orders,
        paid: paid_orders,
        cancelled: cancelled_orders
      },
      revenue,
      sales: {
        daily: parseFloat(daily_sales || 0),
        weekly: parseFloat(weekly_sales || 0),
        monthly: parseFloat(monthly_sales || 0)
      },
      inventoryValue: inventory_value
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 5. Analytics Graphs (Admin only)
router.get('/graphs', verifyToken, isAdmin, async (req, res) => {
  try {
    // 1. Visitors log (last 7 days)
    const [visitorData] = await pool.query(
      `SELECT visit_date as label, COUNT(*) as value 
       FROM visitor_logs 
       GROUP BY visit_date 
       ORDER BY visit_date ASC 
       LIMIT 7`
    );

    // 2. Sales graph (last 7 days)
    const [salesData] = await pool.query(
      `SELECT DATE(created_at) as label, SUM(total_amount) as value 
       FROM orders 
       WHERE payment_status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY label ASC`
    );

    // 3. Category distribution (Product count per category)
    const [categoryData] = await pool.query(
      `SELECT category as label, COUNT(*) as value 
       FROM products 
       GROUP BY category`
    );

    // 4. Peak visiting hours (Hour of day distribution)
    const [hourData] = await pool.query(
      `SELECT visit_hour as label, COUNT(*) as value 
       FROM visitor_logs 
       GROUP BY visit_hour 
       ORDER BY visit_hour ASC`
    );

    res.json({
      visitors: visitorData,
      sales: salesData,
      categories: categoryData,
      hours: hourData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 6. Best/Least Selling & Customer lists (Admin only)
router.get('/lists', verifyToken, isAdmin, async (req, res) => {
  try {
    // Best Sellers
    const [bestSellers] = await pool.query(
      `SELECT product_name as name, SUM(quantity) as sold, SUM(quantity * price) as revenue 
       FROM order_items 
       GROUP BY product_id, product_name 
       ORDER BY sold DESC 
       LIMIT 5`
    );

    // Least Sellers (Products with 0 sales or minimal)
    const [leastSellers] = await pool.query(
      `SELECT p.name, COALESCE(SUM(oi.quantity), 0) as sold 
       FROM products p 
       LEFT JOIN order_items oi ON p.id = oi.product_id 
       GROUP BY p.id, p.name 
       ORDER BY sold ASC 
       LIMIT 5`
    );

    // Customer list
    const [customers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, COUNT(o.id) as orders_count, COALESCE(SUM(o.total_amount), 0) as total_spent 
       FROM users u 
       LEFT JOIN orders o ON u.id = o.user_id 
       WHERE u.role = 'customer' 
       GROUP BY u.id 
       ORDER BY total_spent DESC`
    );

    res.json({
      bestSellers,
      leastSellers,
      customers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 7. Export Reports (Admin only)
router.get('/reports/export', verifyToken, isAdmin, async (req, res) => {
  const { format, type } = req.query; // format = 'pdf' | 'excel', type = 'daily' | 'weekly' | 'monthly'

  try {
    let dateInterval = '1 DAY';
    if (type === 'weekly') dateInterval = '7 DAY';
    if (type === 'monthly') dateInterval = '30 DAY';

    // Fetch order list for report
    const [orders] = await pool.query(
      `SELECT o.*, GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.product_name) SEPARATOR ', ') as items 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval}) 
       GROUP BY o.id 
       ORDER BY o.created_at DESC`
    );

    const [[{ totalSales }]] = await pool.query(
      `SELECT SUM(total_amount) as total 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval}) AND payment_status = 'paid'`
    );

    const [[{ totalOrders }]] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})`
    );

    const formattedTotal = parseFloat(totalSales || 0).toFixed(2);

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${type}.pdf`);

      doc.pipe(res);

      // Header
      doc.fontSize(20).text('Gift & Stationery Haven', { align: 'center' });
      doc.fontSize(14).text(`Sales Performance Report - ${type.toUpperCase()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      // Summary KPIs
      doc.fontSize(12).text(`Total Orders: ${totalOrders}`, { bold: true });
      doc.text(`Total Revenue (Paid Orders): $${formattedTotal}`, { bold: true });
      doc.moveDown(2);

      // Table Header
      doc.fontSize(10).text('Order # | Customer | Date | Method | Status | Amount', { bold: true });
      doc.text('---------------------------------------------------------------------------------');
      
      orders.forEach(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString();
        doc.text(`${order.order_number} | ${order.customer_name} | ${orderDate} | ${order.payment_method.toUpperCase()} | ${order.order_status.toUpperCase()} | $${parseFloat(order.total_amount).toFixed(2)}`);
        doc.fontSize(8).fillColor('gray').text(`Items: ${order.items || 'None'}`).fillColor('black').fontSize(10);
        doc.moveDown(0.5);
      });

      doc.end();

    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      worksheet.columns = [
        { header: 'Order Number', key: 'order_number', width: 15 },
        { header: 'Customer Name', key: 'customer_name', width: 20 },
        { header: 'Customer Phone', key: 'customer_phone', width: 15 },
        { header: 'Pickup Date', key: 'pickup_date', width: 12 },
        { header: 'Amount ($)', key: 'total_amount', width: 12 },
        { header: 'Payment Method', key: 'payment_method', width: 15 },
        { header: 'Payment Status', key: 'payment_status', width: 15 },
        { header: 'Order Status', key: 'order_status', width: 18 },
        { header: 'Purchased Items', key: 'items', width: 40 },
        { header: 'Placed Time', key: 'created_at', width: 22 }
      ];

      orders.forEach(o => {
        worksheet.addRow({
          order_number: o.order_number,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          pickup_date: new Date(o.pickup_date).toLocaleDateString(),
          total_amount: parseFloat(o.total_amount),
          payment_method: o.payment_method.toUpperCase(),
          payment_status: o.payment_status.toUpperCase(),
          order_status: o.order_status.toUpperCase(),
          items: o.items,
          created_at: new Date(o.created_at).toLocaleString()
        });
      });

      worksheet.addRow([]);
      worksheet.addRow({
        order_number: 'Summary',
        customer_name: `Total Orders: ${totalOrders}`,
        customer_phone: `Revenue (Paid): $${formattedTotal}`
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${type}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ message: "Invalid format requested." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
