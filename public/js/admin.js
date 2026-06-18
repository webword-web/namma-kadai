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

  } catch (error) {
    console.error('Error fetching dashboard content:', error);
  }
}

// Update stats boxes
function renderStats(stats) {
  document.getElementById('stat-total-orders').textContent = stats.totalOrders;
  document.getElementById('stat-revenue').textContent = `Rs. ${stats.revenue.toLocaleString()}`;
  document.getElementById('stat-today-orders').textContent = stats.todayOrders;
  
  const counts = stats.statusCounts;
  document.getElementById('stat-pending').textContent = counts.Pending;
  document.getElementById('stat-completed').textContent = counts.Delivered;
  document.getElementById('stat-cancelled').textContent = counts.Cancelled;
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
