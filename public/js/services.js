// public/js/services.js
// Fetch services data and render premium service cards

const servicesContainer = document.getElementById('services-grid');

// Mapping of status to badge colour classes
const statusMap = {
  'Available': 'bg-success text-white',
  'Coming Soon': 'bg-warning text-dark',
  'Not Available': 'bg-danger text-white'
};

// Helper to encode WhatsApp message
function encodeWhatsAppMessage(service) {
  const base = 'Hello Apply Pannu Bro, I want to apply for:';
  const name = `Service: ${service.name}`;
  const price = `Price: ₹${service.price}`;
  const msg = `${base}\n${name}\n${price}`;
  return encodeURIComponent(msg);
}

function renderServiceCard(service) {
  const col = document.createElement('div');
  col.className = 'col-md-4 mb-4';
  col.innerHTML = `
    <div class="card h-100 shadow-sm" style="border-radius: var(--border-radius);">
      <div class="card-body d-flex flex-column">
        <div class="d-flex align-items-center mb-3">
          <img src="${service.icon}" alt="${service.name}" class="me-2" style="width:40px;height:40px;object-fit:contain;" />
          <h5 class="card-title mb-0">${service.name}</h5>
        </div>
        <h6 class="text-muted mb-2">${service.tamilName}</h6>
        <p class="card-text flex-grow-1" style="min-height:60px;">${service.description}</p>
        <p class="mb-1"><strong>Price:</strong> ₹${service.price}</p>
        <p class="mb-1"><strong>Processing Time:</strong> ${service.processingTime}</p>
        <span class="badge ${statusMap[service.status] || 'bg-secondary'} mb-3">${service.status}</span>
        <a href="https://wa.me/918525041700?text=${encodeWhatsAppMessage(service)}" target="_blank" class="btn btn-primary-custom mt-auto">
          <i class="bi bi-whatsapp me-2"></i>Apply Now
        </a>
      </div>
    </div>`;
  servicesContainer.appendChild(col);
}

function loadServices() {
  // Try API endpoint first, fallback to local JSON file
  fetch('/api/services')
    .then(res => res.ok ? res.json() : fetch('data/services.json').then(r => r.json()))
    .then(data => {
      const services = data.services || [];
      servicesContainer.innerHTML = '';
      services.forEach(renderServiceCard);
    })
    .catch(err => console.error('Failed to load services:', err));
}

document.addEventListener('DOMContentLoaded', loadServices);
