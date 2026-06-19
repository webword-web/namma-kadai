// Admin Dashboard Logic for Namma Kadai

let orders = [];
let token = localStorage.getItem('nk_admin_token') || null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  // Login button
  const loginBtn = document.getElementById('btn-admin-login');
  if (loginBtn) loginBtn.addEventListener('click', handleAdminLogin);

  // Allow Enter key on password field
  const passField = document.getElementById('admin-login-pass');
  if (passField) passField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
  });

  // Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleAdminLogout);

  // Filters
  const statusFilter = document.getElementById('admin-status-filter');
  if (statusFilter) statusFilter.addEventListener('change', fetchDashboardData);

  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) searchInput.addEventListener('input', fetchDashboardData);

  // Export
  const exportBtn = document.getElementById('admin-export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportOrdersToCSV);

  // Refresh
  const refreshBtn = document.getElementById('btn-refresh-admin');
  if (refreshBtn) refreshBtn.addEventListener('click', fetchDashboardData);

  // Product Form
  const productForm = document.getElementById('product-form');
  if (productForm) productForm.addEventListener('submit', handleProductSubmit);

  const prodImageInput = document.getElementById('prod-image');
  if (prodImageInput) {
    prodImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          document.getElementById('prod-image-base64').value = evt.target.result;
          document.getElementById('prod-image-preview').innerHTML = `<img src="${evt.target.result}" style="height: 100px; border-radius: 8px;">`;
          const urlInput = document.getElementById('prod-image-url');
          if (urlInput) urlInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const prodImageUrlInput = document.getElementById('prod-image-url');
  if (prodImageUrlInput) {
    prodImageUrlInput.addEventListener('input', function(e) {
      const url = e.target.value.trim();
      if (url) {
        document.getElementById('prod-image-base64').value = url;
        document.getElementById('prod-image-preview').innerHTML = `<img src="${url}" style="height: 100px; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/100?text=Invalid+Image'">`;
        const fileInput = document.getElementById('prod-image');
        if (fileInput) fileInput.value = '';
      } else {
        const fileInput = document.getElementById('prod-image');
        if (!fileInput || !fileInput.files.length) {
          document.getElementById('prod-image-base64').value = '';
          document.getElementById('prod-image-preview').innerHTML = '';
        }
      }
    });
  }

  // Theme Form
  const themeForm = document.getElementById('theme-settings-form');
  if (themeForm) themeForm.addEventListener('submit', handleThemeSubmit);

  const resetThemeBtn = document.getElementById('btn-theme-reset');
  if (resetThemeBtn) resetThemeBtn.addEventListener('click', resetThemeToDefault);

  const previewThemeBtn = document.getElementById('btn-theme-preview');
  if (previewThemeBtn) previewThemeBtn.addEventListener('click', previewThemeSettings);

  // Recycle Bin & Backup
  const recycleFilter = document.getElementById('recycle-type-filter');
  if (recycleFilter) recycleFilter.addEventListener('change', fetchRecycleBin);

  const backupBtn = document.getElementById('btn-trigger-backup');
  if (backupBtn) backupBtn.addEventListener('click', triggerBackup);
});

// Show/hide password toggle
function togglePassword() {
  const passField = document.getElementById('admin-login-pass');
  const icon = document.getElementById('toggle-pass-icon');
  if (passField.type === 'password') {
    passField.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    passField.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// Check auth state
function checkAuth() {
  const loginSection = document.getElementById('admin-login-section');
  const dashboardSection = document.getElementById('admin-dashboard-section');
  if (!loginSection || !dashboardSection) return;

  if (token) {
    loginSection.classList.add('d-none');
    dashboardSection.classList.remove('d-none');
    fetchDashboardData();
  } else {
    loginSection.classList.remove('d-none');
    dashboardSection.classList.add('d-none');
  }
}

// Handle Login ID + Password login
async function handleAdminLogin() {
  const loginId = document.getElementById('admin-login-id').value.trim();
  const password = document.getElementById('admin-login-pass').value.trim();
  const loginMsg = document.getElementById('admin-login-msg');

  if (!loginId || !password) {
    loginMsg.innerHTML = `<div class="alert alert-danger py-2 small">Please enter Login ID and Password.</div>`;
    return;
  }

  const btn = document.getElementById('btn-admin-login');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Logging in...`;
  loginMsg.innerHTML = '';

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Login failed.');

    token = result.token;
    localStorage.setItem('nk_admin_token', token);
    loginMsg.innerHTML = `<div class="alert alert-success py-2 small"><i class="bi bi-check-circle me-1"></i>Login successful!</div>`;
    setTimeout(() => checkAuth(), 600);

  } catch (error) {
    loginMsg.innerHTML = `<div class="alert alert-danger py-2 small">${error.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Login`;
  }
}

// Logout
function handleAdminLogout() {
  token = null;
  localStorage.removeItem('nk_admin_token');
  const idField = document.getElementById('admin-login-id');
  const passField = document.getElementById('admin-login-pass');
  if (idField) idField.value = '';
  if (passField) passField.value = '';
  const btn = document.getElementById('btn-admin-login');
  if (btn) { btn.disabled = false; btn.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Login`; }
  checkAuth();
}


// Fetch stats and lists
async function fetchDashboardData() {
  if (!token) return;

  try {
    // 1. Fetch Stats
    const statsResponse = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (statsResponse.status === 401 || statsResponse.status === 403) {
      // Token expired or invalid
      handleAdminLogout();
      return;
    }

    const stats = await statsResponse.json();
    renderStats(stats);

    // 2. Fetch Orders
    const statusVal = document.getElementById('admin-status-filter').value;
    const searchVal = document.getElementById('admin-search-input').value.trim();

    let ordersUrl = `/api/admin/orders?status=${statusVal}`;
    if (searchVal) {
      ordersUrl += `&search=${encodeURIComponent(searchVal)}`;
    }

    const ordersResponse = await fetch(ordersUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    orders = await ordersResponse.json();
    renderOrdersList(orders);

    // 3. Fetch Products
    const productsResponse = await fetch('/api/admin/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await productsResponse.json();
    renderProductsList(products);

    // 4. Fetch Reviews
    const reviewsResponse = await fetch('/api/admin/reviews', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reviews = await reviewsResponse.json();
    renderReviewsList(reviews);

    // 5. Fetch Theme Settings
    const themeResponse = await fetch('/api/theme');
    const themeData = await themeResponse.json();
    if (themeData) renderThemeSettings(themeData);

    // 6. Fetch Recycle Bin
    fetchRecycleBin();

  } catch (error) {
    console.error('Error fetching dashboard content:', error);
  }
}

// Update stats boxes
function renderStats(stats) {
  document.getElementById('stat-total-orders').textContent = stats.totalOrders;
  document.getElementById('stat-revenue').textContent = `Rs. ${stats.revenue.toLocaleString()}`;
  document.getElementById('stat-customers').textContent = stats.totalCustomers || 0;
  document.getElementById('stat-products').textContent = stats.totalProducts || 0;
  
  const counts = stats.statusCounts;
  // If stat boxes exist, update them
  if (document.getElementById('stat-today-orders')) {
    document.getElementById('stat-today-orders').textContent = stats.todayOrders;
  }
  if (document.getElementById('stat-pending')) {
    document.getElementById('stat-pending').textContent = counts.Pending;
  }
  if (document.getElementById('stat-completed')) {
    document.getElementById('stat-completed').textContent = counts.Delivered;
  }
}

// Render list of orders in table
function renderOrdersList(ordersList) {
  const tableBody = document.getElementById('admin-orders-table-body');
  if (!tableBody) return;

  if (ordersList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">No orders found matching filters.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  ordersList.forEach((ord, index) => {
    const dateStr = new Date(ord.createdAt).toLocaleDateString();
    const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Status Badge classes
    let badgeClass = 'bg-secondary';
    if (ord.status === 'Pending') badgeClass = 'bg-warning text-dark';
    else if (ord.status === 'Confirmed') badgeClass = 'bg-info text-dark';
    else if (ord.status === 'Packed') badgeClass = 'bg-primary';
    else if (ord.status === 'Out For Delivery') badgeClass = 'bg-primary-subtle text-primary border border-primary';
    else if (ord.status === 'Delivered') badgeClass = 'bg-success';
    else if (ord.status === 'Cancelled') badgeClass = 'bg-danger';

    const itemsSummary = ord.items.map(it => `${it.name} (${it.quantity} ${it.unit})`).join(', ');

    tableBody.innerHTML += `
      <tr>
        <td><strong>${ord.invoiceNumber}</strong></td>
        <td>
          <div class="fw-bold">${ord.customerName}</div>
          <small class="text-muted">${ord.mobileNumber}</small>
        </td>
        <td>${dateStr} <br><small class="text-muted">${timeStr}</small></td>
        <td>
          <div class="text-truncate" style="max-width: 200px;" title="${itemsSummary}">${itemsSummary}</div>
        </td>
        <td><strong>Rs. ${ord.grandTotal}</strong></td>
        <td><span class="badge ${badgeClass}">${ord.status}</span></td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${ord._id}', this.value)">
            <option value="Pending" ${ord.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${ord.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Packed" ${ord.status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Out For Delivery" ${ord.status === 'Out For Delivery' ? 'selected' : ''}>Out For Delivery</option>
            <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-success" onclick="viewOrderDetails('${ord._id}')" title="View details"><i class="bi bi-eye"></i></button>
            <a href="/api/orders/${ord._id}/invoice-pdf" target="_blank" class="btn btn-sm btn-outline-secondary" title="Invoice PDF"><i class="bi bi-file-earmark-pdf"></i></a>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${ord._id}')" title="Delete Order"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Modify status update API
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Status update failed.');
    }

    // Refresh dashboard data
    fetchDashboardData();

  } catch (error) {
    console.error('Error modifying order status:', error);
    alert(error.message);
  }
}

async function deleteOrder(id) {
  if (!confirm('Are you sure you want to delete this order? It will be moved to the Recycle Bin.')) return;
  try {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchDashboardData();
    } else {
      alert('Failed to delete order.');
    }
  } catch (error) {
    alert('Error deleting order.');
  }
}

// Admin detail viewer
function viewOrderDetails(orderId) {
  const order = orders.find(o => o._id === orderId);
  if (!order) return;

  const modalBody = document.getElementById('adminOrderModalBody');
  if (!modalBody) return;

  const itemsHtml = order.items.map(it => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <strong>${it.name}</strong> <br>
        <small class="text-muted">Unit price: Rs. ${it.price} | Qty: ${it.quantity} ${it.unit}</small>
      </div>
      <span class="fw-bold">Rs. ${it.price * it.quantity}</span>
    </li>
  `).join('');

  modalBody.innerHTML = `
    <div class="row mb-3 pb-3 border-bottom">
      <div class="col-sm-6">
        <p class="mb-1 text-muted small">Invoice Number</p>
        <h5 class="fw-bold text-success">${order.invoiceNumber}</h5>
        <p class="mb-1 text-muted small">Order Date</p>
        <p class="mb-0 fw-semibold">${new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <div class="col-sm-6 text-sm-end">
        <p class="mb-1 text-muted small">Delivery Status</p>
        <h5 class="fw-bold"><span class="badge bg-success">${order.status}</span></h5>
      </div>
    </div>
    
    <div class="mb-4">
      <h6 class="fw-bold text-success"><i class="bi bi-person-fill me-2"></i>Customer Delivery Details</h6>
      <table class="table table-sm table-borderless">
        <tr><td class="text-muted" style="width: 30%;">Name:</td><td class="fw-semibold">${order.customerName}</td></tr>
        <tr><td class="text-muted">Mobile Number:</td><td class="fw-semibold">${order.mobileNumber} ${order.alternativeMobile ? ` / ${order.alternativeMobile}` : ''}</td></tr>
        <tr><td class="text-muted">Delivery Address:</td><td>${order.deliveryAddress}</td></tr>
        <tr><td class="text-muted">Area / Village:</td><td>${order.villageArea} - ${order.pincode}</td></tr>
        ${order.landmark ? `<tr><td class="text-muted">Landmark:</td><td>${order.landmark}</td></tr>` : ''}
        ${order.specialInstructions ? `<tr><td class="text-muted">Notes:</td><td class="text-danger italic">${order.specialInstructions}</td></tr>` : ''}
      </table>
    </div>
    
    <div>
      <h6 class="fw-bold text-success"><i class="bi bi-box-seam me-2"></i>Items Breakdown</h6>
      <ul class="list-group list-group-flush border rounded mb-3">
        ${itemsHtml}
      </ul>
      <div class="text-end">
        <p class="mb-1 text-muted">Subtotal: <strong>Rs. ${order.subtotal}</strong></p>
        <p class="mb-1 text-muted">Delivery: <strong>Rs. ${order.deliveryCharge}</strong></p>
        <h5 class="fw-bold text-success">Grand Total: Rs. ${order.grandTotal}</h5>
      </div>
    </div>
  `;

  // Show detailed modal
  const detailsModal = new bootstrap.Modal(document.getElementById('adminOrderModal'));
  detailsModal.show();
}

// Export order history as CSV
function exportOrdersToCSV() {
  if (orders.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Create Header row
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Invoice Number,Customer Name,Mobile,Date,Grand Total,Status,Delivery Area\n";

  orders.forEach(o => {
    const row = [
      o.invoiceNumber,
      `"${o.customerName}"`,
      o.mobileNumber,
      new Date(o.createdAt).toLocaleDateString(),
      o.grandTotal,
      o.status,
      `"${o.villageArea}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `NammaKadai_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- PRODUCTS MANAGEMENT ---

let currentProducts = [];

function renderProductsList(products) {
  currentProducts = products;
  const tableBody = document.getElementById('admin-products-table-body');
  if (!tableBody) return;

  if (products.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No products found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = products.map(p => {
    const isOutOfStock = p.stockStatus === 'Out of Stock';
    return `
      <tr>
        <td><img src="${p.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
        <td>
          <div class="fw-bold">${p.name}</div>
          ${p.featured ? '<span class="badge bg-warning text-dark border border-warning" style="font-size:0.6rem;">Featured</span>' : ''}
        </td>
        <td>${p.category}</td>
        <td>Rs. ${p.price} <small class="text-muted">/ ${p.unit}</small></td>
        <td><strong>${p.stockQuantity}</strong></td>
        <td>
          <span class="badge ${isOutOfStock ? 'bg-danger' : 'bg-success'}">${p.stockStatus}</span>
        </td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${p._id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${p._id}')"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-image-base64').value = '';
  document.getElementById('prod-image-preview').innerHTML = '';
  document.getElementById('productModalLabel').textContent = 'Add New Product';
}

function editProduct(id) {
  const p = currentProducts.find(x => x._id === id);
  if (!p) return;
  document.getElementById('prod-id').value = p._id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-category').value = p.category;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-unit').value = p.unit;
  document.getElementById('prod-stock').value = p.stockQuantity;
  document.getElementById('prod-featured').checked = p.featured;
  document.getElementById('prod-image-base64').value = p.image;
  
  if (p.image && p.image.startsWith('http')) {
    document.getElementById('prod-image-url').value = p.image;
  } else {
    document.getElementById('prod-image-url').value = '';
  }
  document.getElementById('prod-image').value = '';

  document.getElementById('prod-image-preview').innerHTML = `<img src="${p.image}" style="height: 100px; border-radius: 8px;">`;
  document.getElementById('productModalLabel').textContent = 'Edit Product';
  
  new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function handleProductSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('prod-id').value;
  const payload = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    price: document.getElementById('prod-price').value,
    unit: document.getElementById('prod-unit').value,
    stockQuantity: document.getElementById('prod-stock').value,
    featured: document.getElementById('prod-featured').checked,
    image: document.getElementById('prod-image-base64').value
  };

  if (!payload.image) {
    alert('Please upload an image or provide an image URL.');
    return;
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/products/${id}` : `/api/admin/products`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
      fetchDashboardData();
    } else {
      const data = await res.json();
      alert('Failed: ' + data.message);
    }
  } catch (error) {
    alert('Error saving product.');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchDashboardData();
    } else {
      alert('Failed to delete.');
    }
  } catch (error) {
    alert('Error deleting product.');
  }
}

// --- REVIEWS MANAGEMENT ---

function renderReviewsList(reviews) {
  const tableBody = document.getElementById('admin-reviews-table-body');
  if (!tableBody) return;

  if (reviews.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No reviews found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = reviews.map(r => {
    const starsHtml = Array(r.rating).fill('<i class="bi bi-star-fill text-warning"></i>').join('') + 
                      Array(5 - r.rating).fill('<i class="bi bi-star text-warning"></i>').join('');
    
    let statusBadge = '';
    if (r.status === 'pending') statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
    else if (r.status === 'approved') statusBadge = '<span class="badge bg-success">Approved</span>';
    else if (r.status === 'hidden') statusBadge = '<span class="badge bg-secondary">Hidden</span>';

    return `
      <tr>
        <td class="fw-bold">${r.customerName}</td>
        <td>${starsHtml}</td>
        <td><div style="max-width:250px;" class="text-truncate" title="${r.message}">${r.message}</div></td>
        <td>${new Date(r.createdAt).toLocaleDateString()}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="d-flex gap-1">
            ${r.status !== 'approved' ? `<button class="btn btn-sm btn-outline-success" onclick="updateReviewStatus('${r._id}', 'approved')" title="Approve"><i class="bi bi-check-lg"></i></button>` : ''}
            ${r.status !== 'hidden' ? `<button class="btn btn-sm btn-outline-secondary" onclick="updateReviewStatus('${r._id}', 'hidden')" title="Hide"><i class="bi bi-eye-slash"></i></button>` : ''}
            <button class="btn btn-sm btn-outline-danger" onclick="deleteReview('${r._id}')" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateReviewStatus(id, status) {
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchDashboardData();
  } catch (error) {
    alert('Error updating review.');
  }
}

async function deleteReview(id) {
  if (!confirm('Are you sure you want to delete this review?')) return;
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchDashboardData();
  } catch (error) {
    alert('Error deleting review.');
  }
}

// --- THEME SETTINGS MANAGEMENT ---

function renderThemeSettings(theme) {
  if (theme.primaryColor) document.getElementById('theme-primary').value = theme.primaryColor;
  if (theme.secondaryColor) document.getElementById('theme-secondary').value = theme.secondaryColor;
  if (theme.headerBg) document.getElementById('theme-header').value = theme.headerBg;
  if (theme.footerBg) document.getElementById('theme-footer').value = theme.footerBg;
  if (theme.pageBg) document.getElementById('theme-bg').value = theme.pageBg;
  if (theme.textColor) document.getElementById('theme-text').value = theme.textColor;
  if (theme.buttonColor) document.getElementById('theme-button').value = theme.buttonColor;
}

async function handleThemeSubmit(e) {
  e.preventDefault();
  
  const payload = {
    primaryColor: document.getElementById('theme-primary').value,
    secondaryColor: document.getElementById('theme-secondary').value,
    headerBg: document.getElementById('theme-header').value,
    footerBg: document.getElementById('theme-footer').value,
    pageBg: document.getElementById('theme-bg').value,
    textColor: document.getElementById('theme-text').value,
    buttonColor: document.getElementById('theme-button').value
  };

  try {
    const btn = document.getElementById('btn-theme-save');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const res = await fetch('/api/admin/theme', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Theme updated successfully! The store frontend will reflect these changes.');
    } else {
      alert('Failed to update theme.');
    }
  } catch (error) {
    alert('Error updating theme.');
  } finally {
    const btn = document.getElementById('btn-theme-save');
    btn.disabled = false;
    btn.textContent = 'Save Theme Globally';
  }
}

function previewThemeSettings() {
  alert('In a real scenario, this would apply CSS variables instantly for preview. For now, click Save to persist.');
}

function resetThemeToDefault() {
  document.getElementById('theme-primary').value = '#2e7d32';
  document.getElementById('theme-secondary').value = '#4caf50';
  document.getElementById('theme-header').value = '#ffffff';
  document.getElementById('theme-footer').value = '#212529';
  document.getElementById('theme-bg').value = '#f8f9fa';
  document.getElementById('theme-text').value = '#333333';
  document.getElementById('theme-button').value = '#2e7d32';
}

// --- RECYCLE BIN ---

async function fetchRecycleBin() {
  const type = document.getElementById('recycle-type-filter').value || 'products';
  try {
    const res = await fetch(`/api/admin/recycle-bin/${type}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const items = await res.json();
    renderRecycleBin(items, type);
  } catch (error) {
    console.error('Error fetching recycle bin:', error);
  }
}

function renderRecycleBin(items, type) {
  const tableBody = document.getElementById('admin-recycle-table-body');
  if (!tableBody) return;

  if (items.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Recycle bin is empty for ${type}.</td></tr>`;
    return;
  }

  tableBody.innerHTML = items.map(item => {
    let title = '';
    if (type === 'products') title = item.name;
    else if (type === 'orders') title = `Invoice: ${item.invoiceNumber} - ${item.customerName}`;
    else if (type === 'reviews') title = `Review by ${item.customerName}`;

    return `
      <tr>
        <td class="fw-bold">${title}</td>
        <td>${new Date(item.deletedAt || new Date()).toLocaleString()}</td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-success" onclick="restoreRecycleItem('${type}', '${item._id}')" title="Restore"><i class="bi bi-arrow-counterclockwise"></i> Restore</button>
            <button class="btn btn-sm btn-outline-danger" onclick="permanentDeleteRecycleItem('${type}', '${item._id}')" title="Delete Permanently"><i class="bi bi-x-circle"></i> Permanent Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function restoreRecycleItem(type, id) {
  try {
    const res = await fetch(`/api/admin/recycle-bin/restore/${type}/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchDashboardData(); // Refreshes everything including recycle bin
    } else {
      alert('Failed to restore item.');
    }
  } catch (error) {
    alert('Error restoring item.');
  }
}

async function permanentDeleteRecycleItem(type, id) {
  if (!confirm('WARNING: This will permanently delete the item and it cannot be recovered. Are you sure?')) return;
  try {
    const res = await fetch(`/api/admin/recycle-bin/permanent/${type}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchDashboardData();
    } else {
      alert('Failed to permanently delete item.');
    }
  } catch (error) {
    alert('Error permanently deleting item.');
  }
}

// --- DATABASE BACKUPS ---

async function triggerBackup() {
  const backupBtn = document.getElementById('btn-trigger-backup');
  const msgDiv = document.getElementById('backup-message');
  
  backupBtn.disabled = true;
  backupBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Generating Backup...`;
  msgDiv.innerHTML = '';
  
  try {
    const res = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      msgDiv.innerHTML = `<div class="alert alert-success mt-3 py-2"><i class="bi bi-check-circle me-1"></i> Backup created successfully: <strong>${data.filename}</strong></div>`;
    } else {
      msgDiv.innerHTML = `<div class="alert alert-danger mt-3 py-2"><i class="bi bi-x-circle me-1"></i> Failed to create backup.</div>`;
    }
  } catch (error) {
    msgDiv.innerHTML = `<div class="alert alert-danger mt-3 py-2"><i class="bi bi-x-circle me-1"></i> Error creating backup.</div>`;
  } finally {
    backupBtn.disabled = false;
    backupBtn.innerHTML = `<i class="bi bi-cloud-arrow-down me-2"></i> Download Database Backup`;
  }
}
