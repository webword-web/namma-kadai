require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { connectDB, Product, Order, User, isFallback } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nammakadai_super_secret_key_987654321';

// Middleware
app.parseJson = express.json();
app.use(cors());
app.use(app.parseJson);
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
};

// --- AUTH ENDPOINTS ---

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// --- PRODUCT ENDPOINTS ---

app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search };
    }

    let productsList = await Product.find(query);

    // Apply Sorting
    if (sort === 'price-low') {
      productsList.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      productsList.sort((a, b) => b.price - a.price);
    } else if (sort === 'latest') {
      productsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(productsList);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// --- ORDER ENDPOINTS ---

// Create Order (Checkout)
app.post('/api/orders', async (req, res) => {
  const {
    customerName,
    mobileNumber,
    alternativeMobile,
    deliveryAddress,
    landmark,
    villageArea,
    pincode,
    specialInstructions,
    items,
    subtotal,
    deliveryCharge,
    grandTotal
  } = req.body;

  if (!customerName || !mobileNumber || !deliveryAddress || !villageArea || !pincode || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing required checkout information.' });
  }

  try {
    // Generate unique Invoice Number: NK-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `NK-${dateStr}-${randDigits}`;

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const orderData = {
      invoiceNumber,
      customerName,
      mobileNumber,
      alternativeMobile,
      deliveryAddress,
      landmark,
      villageArea,
      pincode,
      specialInstructions,
      items,
      totalItems,
      subtotal,
      deliveryCharge,
      grandTotal,
      status: 'Pending'
    };

    const newOrder = await Order.create(orderData);

    // Trigger Async Notifications
    sendOrderEmail(newOrder).catch(err => console.error('Nodemailer error:', err));

    res.status(201).json({
      message: 'Order created successfully.',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to place order.' });
  }
});

// Track Order Status
app.get('/api/orders/track/:mobile', async (req, res) => {
  const { mobile } = req.params;
  try {
    const ordersList = await Order.find({ mobileNumber: mobile });
    // Sort descending by date
    ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(ordersList);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ message: 'Failed to track order.' });
  }
});

// --- ADMIN ENDPOINTS ---

// Get All Orders (Admin Dashboard)
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  const { status, search } = req.query;
  try {
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.customerName = { $regex: search };
    }

    const ordersList = await Order.find(query);
    ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(ordersList);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// Update Order Status
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json({ message: 'Order status updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

// Dashboard Stats
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const ordersList = await Order.find({});
    
    const totalOrders = ordersList.length;
    
    // Revenue from non-cancelled orders
    const revenue = ordersList
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = ordersList.filter(o => o.createdAt.toString().includes(todayStr)).length;

    const pendingCount = ordersList.filter(o => o.status === 'Pending').length;
    const confirmedCount = ordersList.filter(o => o.status === 'Confirmed').length;
    const packedCount = ordersList.filter(o => o.status === 'Packed').length;
    const outForDeliveryCount = ordersList.filter(o => o.status === 'Out For Delivery').length;
    const deliveredCount = ordersList.filter(o => o.status === 'Delivered').length;
    const cancelledCount = ordersList.filter(o => o.status === 'Cancelled').length;

    res.json({
      totalOrders,
      revenue,
      todayOrders,
      statusCounts: {
        Pending: pendingCount,
        Confirmed: confirmedCount,
        Packed: packedCount,
        OutForDelivery: outForDeliveryCount,
        Delivered: deliveredCount,
        Cancelled: cancelledCount
      }
    });
  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    res.status(500).json({ message: 'Failed to generate statistics.' });
  }
});

// Download Invoice PDF
app.get('/api/orders/:id/invoice-pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findOne({ _id: id });
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to client response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.invoiceNumber}.pdf`);
    doc.pipe(res);

    // PDF HEADER
    doc.fillColor('#2e7d32')
      .fontSize(22)
      .text('NAMMA KADAI', 50, 45, { align: 'left' });

    doc.fillColor('#666666')
      .fontSize(9)
      .text('Fresh From Farm - Straight To Home', 50, 70)
      .text('Quality You Trust, Freshness You Love', 50, 82);

    doc.fillColor('#333333')
      .fontSize(9)
      .text('No.245, Thideerkuppam, Thammanur,', 360, 45, { align: 'right' })
      .text('Kanchipuram - 631605, Tamil Nadu', 360, 57, { align: 'right' })
      .text('Founder: B. Kamatchi | Phone: +91 8525041700', 360, 69, { align: 'right' })
      .text('Email: nammakadai.tn21@gmail.com', 360, 81, { align: 'right' });

    doc.moveTo(50, 105).lineTo(550, 105).strokeColor('#e0e0e0').stroke();

    // INVOICE DETAILS
    doc.fontSize(14).fillColor('#2e7d32').text('INVOICE', 50, 120);

    doc.fontSize(10).fillColor('#333333')
      .text(`Invoice No: ${order.invoiceNumber}`, 50, 140)
      .text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 50, 155)
      .text(`Payment Mode: Cash on Delivery / UPI`, 50, 170)
      .text(`Order Status: ${order.status}`, 50, 185);

    // BILL TO
    doc.fontSize(11).fillColor('#2e7d32').text('DELIVER TO:', 320, 120);
    doc.fontSize(10).fillColor('#333333')
      .text(order.customerName, 320, 140)
      .text(`Mobile: ${order.mobileNumber}`, 320, 155)
      .text(`Address: ${order.deliveryAddress}`, 320, 170)
      .text(`Area: ${order.villageArea} - ${order.pincode}`, 320, 185);
      if (order.landmark) {
        doc.text(`Landmark: ${order.landmark}`, 320, 200);
      }

    doc.moveTo(50, 225).lineTo(550, 225).strokeColor('#e0e0e0').stroke();

    // ITEMS TABLE HEADER
    let yPos = 240;
    doc.fontSize(10).fillColor('#2e7d32')
      .text('S.No', 50, yPos)
      .text('Item Description', 90, yPos)
      .text('Unit Price', 310, yPos, { width: 70, align: 'right' })
      .text('Qty', 390, yPos, { width: 50, align: 'right' })
      .text('Total (INR)', 460, yPos, { width: 90, align: 'right' });

    doc.moveTo(50, 255).lineTo(550, 255).strokeColor('#e0e0e0').stroke();

    yPos = 265;
    doc.fillColor('#333333');
    order.items.forEach((item, index) => {
      doc.text(`${index + 1}`, 50, yPos)
         .text(`${item.name} (${item.unit})`, 90, yPos)
         .text(`Rs. ${item.price.toFixed(2)}`, 310, yPos, { width: 70, align: 'right' })
         .text(`${item.quantity}`, 390, yPos, { width: 50, align: 'right' })
         .text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 460, yPos, { width: 90, align: 'right' });
      yPos += 20;
    });

    doc.moveTo(50, yPos).lineTo(550, yPos).strokeColor('#e0e0e0').stroke();
    yPos += 15;

    // TOTALS SUMMARY
    doc.fontSize(10)
      .text('Subtotal:', 350, yPos, { width: 100, align: 'right' })
      .text(`Rs. ${order.subtotal.toFixed(2)}`, 460, yPos, { width: 90, align: 'right' });
    yPos += 15;

    doc.text('Delivery Charge:', 350, yPos, { width: 100, align: 'right' })
      .text(`Rs. ${order.deliveryCharge.toFixed(2)}`, 460, yPos, { width: 90, align: 'right' });
    yPos += 18;

    doc.fontSize(11).fillColor('#2e7d32').bold()
      .text('Grand Total:', 350, yPos, { width: 100, align: 'right' })
      .text(`Rs. ${order.grandTotal.toFixed(2)}`, 460, yPos, { width: 90, align: 'right' });
    
    // FOOTER NOTE
    yPos += 45;
    doc.fontSize(10).fillColor('#666666').bold(false)
      .text('Thank you for shopping with Namma Kadai!', 50, yPos, { align: 'center' })
      .text('For delivery updates or queries, please contact B. Kamatchi at +91 8525041700', 50, yPos + 15, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF.');
  }
});

// --- HELPER NOTIFICATION FUNCTIONS ---

// Send Nodemailer order email
async function sendOrderEmail(order) {
  const bypass = process.env.EMAIL_BYPASS === 'true';
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log(`Email Notification Triggered for Order ${order.invoiceNumber}`);

  if (bypass || !emailUser || emailUser.includes('placeholder') || !emailPass || emailPass.includes('placeholder')) {
    console.log('Nodemailer bypassed: Email username/password missing or configuration explicitly set to bypass.');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rs. ${item.price}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rs. ${item.price * item.quantity}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Namma Kadai Notifications" <${emailUser}>`,
    to: 'nammakadai.tn21@gmail.com',
    subject: `Namma Kadai - New Order Placed [${order.invoiceNumber}]`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #4caf50; border-radius: 8px;">
        <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">New Order Received</h2>
        <p><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
        <p><strong>Order Date & Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        
        <h3 style="color: #2e7d32;">Customer Details</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Mobile:</strong> ${order.mobileNumber} ${order.alternativeMobile ? `/ ${order.alternativeMobile}` : ''}</p>
        <p><strong>Delivery Address:</strong> ${order.deliveryAddress}, ${order.villageArea} - ${order.pincode}</p>
        <p><strong>Landmark:</strong> ${order.landmark || 'None'}</p>
        <p><strong>Special Instructions:</strong> ${order.specialInstructions || 'None'}</p>
        
        <h3 style="color: #2e7d32;">Ordered Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #e8f5e9;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Price</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 15px; text-align: right; font-size: 1.1em;">
          <p><strong>Subtotal:</strong> Rs. ${order.subtotal}</p>
          <p><strong>Delivery Charges:</strong> Rs. ${order.deliveryCharge}</p>
          <p style="color: #2e7d32; font-size: 1.2em;"><strong>Grand Total:</strong> Rs. ${order.grandTotal}</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.9em; text-align: center; color: #666;">This is an automated notification from Namma Kadai order system.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Order notification email sent successfully for ${order.invoiceNumber}`);
}

// Start Server after verifying Database
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(` Namma Kadai Backend Server running at: http://localhost:${PORT}`);
    console.log(` Database Mode: ${isFallback() ? 'LOCAL JSON FALLBACK' : 'MONGODB CONNECTED'}`);
    console.log(`========================================================`);
  });
};

startServer();
