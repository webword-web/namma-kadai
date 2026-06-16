// Frontend Logic for Namma Kadai E-Commerce Application

let products = [];
let cart = JSON.parse(localStorage.getItem('nk_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('nk_wishlist')) || [];
let currentCategory = 'All';
let searchWord = '';
let sortBy = 'latest';

document.addEventListener('DOMContentLoaded', () => {
  // Hide Loading Screen
  const loader = document.querySelector('.loader-wrapper');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
    }, 600);
  }

  // Initializations
  fetchProducts();
  updateCartBadge();
  updateWishlistBadge();
  renderCartDrawer();

  // Scroll to Top Logic
  const backToTopBtn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Setup Category Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      fetchProducts();
    });
  });

  // Setup Search Input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchWord = e.target.value;
      fetchProducts();
    });
  }

  // Setup Sort Dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      fetchProducts();
    });
  }

  // Cart Drawer Opens/Closes
  const cartBtn = document.getElementById('cart-btn');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartDrawer = document.getElementById('cart-drawer');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      cartOverlay.classList.add('active');
      cartDrawer.classList.add('active');
    });
  }

  const closeCart = () => {
    cartOverlay.classList.remove('active');
    cartDrawer.classList.remove('active');
  };

  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Setup Checkout Form Submission
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Track Order Input Submission
  const trackBtn = document.getElementById('btn-track-submit');
  if (trackBtn) {
    trackBtn.addEventListener('click', handleOrderTracking);
  }
});

// --- API ACTIONS ---

async function fetchProducts() {
  const container = document.getElementById('product-list-container');
  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-2 text-muted">Gathering fresh harvest...</p>
    </div>
  `;

  try {
    let url = `/api/products?category=${encodeURIComponent(currentCategory)}&sort=${sortBy}`;
    if (searchWord) {
      url += `&search=${encodeURIComponent(searchWord)}`;
    }

    const response = await fetch(url);
    products = await response.json();

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-emoji-frown text-success" style="font-size: 3rem;"></i>
          <h4 class="mt-3">No Products Found</h4>
          <p class="text-muted">Try looking under a different category or search term.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    products.forEach((prod, index) => {
      const isWishlisted = wishlist.includes(prod._id);
      const cardHtml = `
        <div class="col" data-aos="fade-up" data-aos-delay="${(index % 4) * 100}">
          <div class="product-card">
            ${prod.offer ? `<span class="offer-badge">${prod.offer}</span>` : ''}
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(event, '${prod._id}')">
              <i class="bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}"></i>
            </button>
            <div class="product-card-image-wrapper">
              <img src="${prod.image}" class="product-card-img" alt="${prod.name}" id="img-${prod._id}">
            </div>
            <div class="product-info">
              <div class="product-category">${prod.category}</div>
              <h5 class="product-title">${prod.name}</h5>
              <div class="product-unit">Unit: ${prod.unit}</div>
              <div class="product-price-row">
                <div class="product-price">Rs. ${prod.price}</div>
                
                <div class="qty-selector">
                  <button class="qty-btn minus" onclick="changeQtyValue('${prod._id}', -1)">-</button>
                  <input type="number" class="qty-input" id="qty-${prod._id}" value="1" min="1" max="20" readonly>
                  <button class="qty-btn plus" onclick="changeQtyValue('${prod._id}', 1)">+</button>
                </div>
              </div>
              
              <button class="add-to-cart-btn" onclick="addToCartClick('${prod._id}')">
                <i class="bi bi-cart-plus"></i> Add To Cart
              </button>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += cardHtml;
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-danger">Failed to connect to Namma Kadai warehouse. Please refresh page.</p>
      </div>
    `;
  }
}

// --- CART ACTIONS ---

function changeQtyValue(productId, delta) {
  const input = document.getElementById(`qty-${productId}`);
  if (!input) return;
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 20) val = 20;
  input.value = val;
}

function addToCartClick(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;

  const qtyInput = document.getElementById(`qty-${productId}`);
  const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

  // Locate starting point of animation
  const imgElement = document.getElementById(`img-${productId}`);
  if (imgElement) {
    const rect = imgElement.getBoundingClientRect();
    animateFlyToCart(imgElement, rect);
  }

  // Update Cart State
  const cartIndex = cart.findIndex(item => item.productId === productId);
  if (cartIndex > -1) {
    cart[cartIndex].quantity += quantity;
  } else {
    cart.push({
      productId: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: quantity,
      unit: product.unit,
      image: product.image
    });
  }

  saveCart();
  updateCartBadge();
  
  // Instantly render cart drawer updates
  renderCartDrawer();

  // Highlight item in drawer on open
  setTimeout(() => {
    // Open cart drawer
    document.getElementById('cart-overlay').classList.add('active');
    document.getElementById('cart-drawer').classList.add('active');
    
    // Highlight the item
    const drawerItem = document.getElementById(`cart-item-${productId}`);
    if (drawerItem) {
      drawerItem.classList.add('highlight');
      setTimeout(() => drawerItem.classList.remove('highlight'), 1000);
    }
  }, 1000);

  // Reset quantity input to 1
  if (qtyInput) qtyInput.value = 1;
}

function updateCartQty(productId, delta) {
  const index = cart.findIndex(item => item.productId === productId);
  if (index === -1) return;

  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeCartItem(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge-count');
  if (!badge) return;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? 'block' : 'none';
}

function renderCartDrawer() {
  const listContainer = document.getElementById('cart-drawer-items');
  const footerContainer = document.getElementById('cart-drawer-footer-content');
  if (!listContainer || !footerContainer) return;

  if (cart.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x text-muted" style="font-size: 3rem;"></i>
        <p class="mt-3 text-muted">Your basket is empty!</p>
      </div>
    `;
    footerContainer.innerHTML = `
      <button class="btn btn-secondary-custom w-100" onclick="document.getElementById('cart-close').click()">
        Continue Shopping
      </button>
    `;
    return;
  }

  listContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    listContainer.innerHTML += `
      <div class="cart-drawer-item" id="cart-item-${item.productId}">
        <img src="${item.image}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">Rs. ${item.price} <span class="text-muted">x ${item.quantity} ${item.unit}</span></div>
          <div class="qty-selector mt-2" style="max-width: 100px;">
            <button class="qty-btn minus" onclick="updateCartQty('${item.productId}', -1)">-</button>
            <input type="number" class="qty-input" value="${item.quantity}" readonly>
            <button class="qty-btn plus" onclick="updateCartQty('${item.productId}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeCartItem('${item.productId}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
  });

  const deliveryCharge = subtotal > 500 ? 0 : 30; // Free delivery over Rs.500
  const grandTotal = subtotal + deliveryCharge;

  footerContainer.innerHTML = `
    <div class="cart-summary-row">
      <span>Subtotal</span>
      <span>Rs. ${subtotal}</span>
    </div>
    <div class="cart-summary-row">
      <span>Delivery Charges</span>
      <span>${deliveryCharge === 0 ? '<span class="text-success">FREE</span>' : `Rs. ${deliveryCharge}`}</span>
    </div>
    <div class="cart-summary-row total">
      <span>Grand Total</span>
      <span>Rs. ${grandTotal}</span>
    </div>
    
    <div class="d-grid gap-2 mt-4">
      <button class="btn btn-primary-custom" onclick="openCheckoutModal()">Proceed to Order</button>
      <button class="btn btn-secondary-custom" onclick="document.getElementById('cart-close').click()">Continue Shopping</button>
    </div>
  `;
}

function saveCart() {
  localStorage.setItem('nk_cart', JSON.stringify(cart));
}

// GSAP Flying Curve Animation helper
function animateFlyToCart(imgElement, startRect) {
  const cartIcon = document.getElementById('cart-btn');
  if (!cartIcon) return;
  const cartRect = cartIcon.getBoundingClientRect();
  
  const flyer = document.createElement('img');
  flyer.src = imgElement.src;
  flyer.classList.add('flying-img');
  document.body.appendChild(flyer);
  
  gsap.set(flyer, {
    left: startRect.left,
    top: startRect.top + window.scrollY,
    width: startRect.width,
    height: startRect.height,
    borderRadius: '12px'
  });
  
  gsap.to(flyer, {
    duration: 0.8,
    left: cartRect.left + (cartRect.width / 2) - 15,
    top: cartRect.top + window.scrollY + (cartRect.height / 2) - 15,
    width: 25,
    height: 25,
    borderRadius: '50%',
    opacity: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      flyer.remove();
      // Animate cart button bouncing
      gsap.fromTo(cartIcon, 
        { scale: 1 }, 
        { scale: 1.3, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }
      );
    }
  });
}

// --- WISHLIST ACTIONS ---

function toggleWishlist(e, productId) {
  e.stopPropagation();
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(productId);
  }
  localStorage.setItem('nk_wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
  fetchProducts(); // Refresh icon states
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-badge-count');
  if (!badge) return;
  const count = wishlist.length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'block' : 'none';
}

// --- CHECKOUT & INVOICE FLOW ---

let generatedOrder = null;

function openCheckoutModal() {
  // Close cart drawer
  document.getElementById('cart-close').click();
  // Open checkout modal
  const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
  checkoutModal.show();
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const customerName = document.getElementById('cust-name').value.trim();
  const mobileNumber = document.getElementById('cust-mobile').value.trim();
  const alternativeMobile = document.getElementById('cust-alt-mobile').value.trim();
  const deliveryAddress = document.getElementById('cust-address').value.trim();
  const landmark = document.getElementById('cust-landmark').value.trim();
  const villageArea = document.getElementById('cust-village').value.trim();
  const pincode = document.getElementById('cust-pincode').value.trim();
  const specialInstructions = document.getElementById('cust-instructions').value.trim();

  // Validate Pincode and numbers
  if (!/^\d{6}$/.test(pincode)) {
    alert('Please enter a valid 6-digit Pincode.');
    return;
  }
  if (!/^\d{10}$/.test(mobileNumber)) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal > 500 ? 0 : 30;
  const grandTotal = subtotal + deliveryCharge;

  const orderPayload = {
    customerName,
    mobileNumber,
    alternativeMobile,
    deliveryAddress,
    landmark,
    villageArea,
    pincode,
    specialInstructions,
    items: cart,
    subtotal,
    deliveryCharge,
    grandTotal
  };

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to place order.');
    }

    generatedOrder = result.order;

    // Clear local basket
    cart = [];
    saveCart();
    updateCartBadge();
    renderCartDrawer();

    // Close Checkout Modal
    bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();

    // Render Invoice Preview Modal
    renderInvoicePreview(generatedOrder);
    
    // Open Invoice Preview Modal
    const invoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    invoiceModal.show();

  } catch (error) {
    console.error('Checkout error:', error);
    alert(error.message || 'Something went wrong during checkout. Please try again.');
  }
}

function renderInvoicePreview(order) {
  const container = document.getElementById('invoice-preview-content');
  if (!container) return;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td class="text-center">${item.quantity} ${item.unit}</td>
      <td class="text-end">Rs. ${item.price}</td>
      <td class="text-end">Rs. ${item.price * item.quantity}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="invoice-container text-dark">
      <div class="invoice-header-row">
        <div>
          <h3 class="text-success font-serif fw-bold mb-1">NAMMA KADAI</h3>
          <p class="text-muted small mb-0">Fresh From Farm - Straight To Home</p>
        </div>
        <div class="text-end">
          <p class="mb-0 fw-bold">INVOICE</p>
          <span class="badge bg-success-subtle text-success">${order.status}</span>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-sm-6 mb-3 mb-sm-0">
          <p class="text-muted small mb-1">Invoice Info:</p>
          <p class="mb-0"><strong>Invoice No:</strong> ${order.invoiceNumber}</p>
          <p class="mb-0"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p class="mb-0"><strong>Payment:</strong> Cash on Delivery / UPI</p>
        </div>
        <div class="col-sm-6 text-sm-end">
          <p class="text-muted small mb-1">Deliver To:</p>
          <p class="mb-0"><strong>Name:</strong> ${order.customerName}</p>
          <p class="mb-0"><strong>Mobile:</strong> ${order.mobileNumber}</p>
          <p class="mb-0"><strong>Address:</strong> ${order.deliveryAddress}, ${order.villageArea} - ${order.pincode}</p>
          ${order.landmark ? `<p class="mb-0"><strong>Landmark:</strong> ${order.landmark}</p>` : ''}
        </div>
      </div>
      
      <div class="table-responsive mb-4">
        <table class="table table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>Item</th>
              <th class="text-center" style="width: 15%">Qty</th>
              <th class="text-end" style="width: 20%">Price</th>
              <th class="text-end" style="width: 25%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div class="row justify-content-end">
        <div class="col-md-5 col-sm-8">
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Subtotal:</span>
            <span class="fw-semibold">Rs. ${order.subtotal}</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Delivery Charges:</span>
            <span>${order.deliveryCharge === 0 ? '<span class="text-success fw-bold">FREE</span>' : `Rs. ${order.deliveryCharge}`}</span>
          </div>
          <div class="d-flex justify-content-between border-top pt-2">
            <span class="fw-bold fs-5 text-success">Grand Total:</span>
            <span class="fw-bold fs-5 text-success">Rs. ${order.grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Setup click triggers on invoice actions
  const btnPdf = document.getElementById('btn-download-pdf');
  if (btnPdf) {
    btnPdf.onclick = () => window.open(`/api/orders/${order._id}/invoice-pdf`, '_blank');
  }

  const btnConfirm = document.getElementById('btn-whatsapp-confirm');
  if (btnConfirm) {
    btnConfirm.onclick = () => triggerWhatsAppRedirect(order);
  }
}

function triggerWhatsAppRedirect(order) {
  // Format products list
  const productsStr = order.items.map(item => `*${item.name}*\nQty: ${item.quantity} ${item.unit}\nPrice: Rs. ${item.price * item.quantity}`).join('\n\n');

  // Format WhatsApp message Template
  const message = `------------------------------------------------
*Namma Kadai - New Order*

*Customer Name:*
${order.customerName}

*Mobile:*
${order.mobileNumber}

*Delivery Address:*
${order.deliveryAddress}, ${order.villageArea} - ${order.pincode}
${order.landmark ? `Landmark: ${order.landmark}` : ''}

*Products:*

${productsStr}

*Subtotal:* Rs. ${order.subtotal}
*Delivery Charges:* Rs. ${order.deliveryCharge}
*Grand Total:* Rs. ${order.grandTotal}

*Invoice Number:* ${order.invoiceNumber}
*Order Date & Time:* ${new Date(order.createdAt).toLocaleString()}
------------------------------------------------

Please confirm my order.`;

  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/918525041700?text=${encodedMsg}`;
  
  // Close invoice Modal
  bootstrap.Modal.getInstance(document.getElementById('invoiceModal')).hide();
  
  // Redirect to WhatsApp
  window.open(waUrl, '_blank');
}

// --- ORDER TRACKING ---

async function handleOrderTracking() {
  const mobileInput = document.getElementById('track-mobile-input').value.trim();
  const trackResults = document.getElementById('track-results');
  if (!trackResults) return;

  if (!/^\d{10}$/.test(mobileInput)) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }

  trackResults.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-2 text-muted">Searching delivery log...</p>
    </div>
  `;

  try {
    const response = await fetch(`/api/orders/track/${mobileInput}`);
    const orders = await response.json();

    if (orders.length === 0) {
      trackResults.innerHTML = `
        <div class="alert alert-warning text-center mt-3" role="alert">
          <i class="bi bi-info-circle-fill me-2"></i> No orders found under mobile number <strong>${mobileInput}</strong>.
        </div>
      `;
      return;
    }

    trackResults.innerHTML = '';
    
    // Draw the latest order's tracking timeline
    const latestOrder = orders[0];
    
    // Setup timeline tracking active indexes
    const statuses = ['Pending', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(latestOrder.status);

    let timelineHtml = `
      <div class="card shadow-sm border border-success-subtle mb-4">
        <div class="card-header bg-success-subtle text-success py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="fw-bold"><i class="bi bi-receipt-cutoff me-2"></i>Invoice No: ${latestOrder.invoiceNumber}</span>
          <span class="badge bg-success">${latestOrder.status}</span>
        </div>
        <div class="card-body p-4">
          <div class="row mb-3 border-bottom pb-3">
            <div class="col-sm-6 mb-2 mb-sm-0">
              <small class="text-muted d-block">Order Placed On:</small>
              <strong>${new Date(latestOrder.createdAt).toLocaleString()}</strong>
            </div>
            <div class="col-sm-6 text-sm-end">
              <small class="text-muted d-block">Grand Total:</small>
              <strong class="text-success fs-5">Rs. ${latestOrder.grandTotal}</strong>
            </div>
          </div>
          
          <h6 class="fw-bold mb-4 text-center">Delivery Timeline Status</h6>
          <div class="tracking-timeline">
            <!-- Progress line background -->
            <div class="tracking-timeline-progress" id="progress-line-track"></div>
            
            <div class="timeline-step ${currentStatusIndex >= 0 ? 'active' : ''}">
              <div class="timeline-step-icon"><i class="bi bi-clock"></i></div>
              <div class="timeline-step-title">Pending</div>
            </div>
            <div class="timeline-step ${currentStatusIndex >= 1 ? (currentStatusIndex === 1 ? 'active' : 'completed') : ''}">
              <div class="timeline-step-icon"><i class="bi bi-check-circle"></i></div>
              <div class="timeline-step-title">Confirmed</div>
            </div>
            <div class="timeline-step ${currentStatusIndex >= 2 ? (currentStatusIndex === 2 ? 'active' : 'completed') : ''}">
              <div class="timeline-step-icon"><i class="bi bi-box-seam"></i></div>
              <div class="timeline-step-title">Packed</div>
            </div>
            <div class="timeline-step ${currentStatusIndex >= 3 ? (currentStatusIndex === 3 ? 'active' : 'completed') : ''}">
              <div class="timeline-step-icon"><i class="bi bi-truck"></i></div>
              <div class="timeline-step-title">Out For Delivery</div>
            </div>
            <div class="timeline-step ${currentStatusIndex >= 4 ? 'active' : ''}">
              <div class="timeline-step-icon"><i class="bi bi-house-door"></i></div>
              <div class="timeline-step-title">Delivered</div>
            </div>
          </div>
          
          <!-- Tracking Items Breakdown collapsed trigger -->
          <div class="mt-4 pt-3 border-top">
            <button class="btn btn-sm btn-outline-success" type="button" data-bs-toggle="collapse" data-bs-target="#items-collapse-${latestOrder._id}">
              <i class="bi bi-list-stars me-1"></i> View Ordered Products (${latestOrder.totalItems})
            </button>
            <div class="collapse mt-3" id="items-collapse-${latestOrder._id}">
              <ul class="list-group list-group-flush border rounded">
                ${latestOrder.items.map(it => `
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${it.name} <small class="text-muted">(${it.quantity} ${it.unit})</small></span>
                    <span class="fw-bold">Rs. ${it.price * it.quantity}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add list of previous orders if any
    if (orders.length > 1) {
      timelineHtml += `
        <h6 class="fw-bold mt-4 mb-3"><i class="bi bi-clock-history me-2"></i>Previous Orders History</h6>
        <div class="list-group shadow-sm">
          ${orders.slice(1).map(ord => `
            <div class="list-group-item list-group-item-action p-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold text-success">${ord.invoiceNumber}</span>
                <span class="badge bg-secondary">${ord.status}</span>
              </div>
              <div class="d-flex justify-content-between text-muted small">
                <span>Date: ${new Date(ord.createdAt).toLocaleDateString()}</span>
                <span>Total: Rs. ${ord.grandTotal}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    trackResults.innerHTML = timelineHtml;

    // Apply percentage layout to horizontal/vertical progress line
    setTimeout(() => {
      const line = document.getElementById('progress-line-track');
      if (!line) return;
      
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Vertical height mapping
        const heightPercentage = (currentStatusIndex / 4) * 100;
        line.style.width = '4px';
        line.style.height = `${heightPercentage}%`;
      } else {
        // Horizontal width mapping
        const widthPercentage = (currentStatusIndex / 4) * 90;
        line.style.width = `${widthPercentage}%`;
        line.style.height = '4px';
      }
    }, 100);

  } catch (error) {
    console.error('Error tracking orders:', error);
    trackResults.innerHTML = `
      <div class="alert alert-danger text-center mt-3" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i> Database response failed. Please try again.
      </div>
    `;
  }
}
