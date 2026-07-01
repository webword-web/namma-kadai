// public/js/home.js
// Load services and jobs for the homepage and render premium cards

const servicesContainer = document.getElementById('service-highlights-container');
const jobsContainer = document.getElementById('job-updates-container');

const statusMap = {
  'Available': 'bg-success text-white',
  'Coming Soon': 'bg-warning text-dark',
  'Not Available': 'bg-danger text-white'
};

function encodeWhatsAppMessage(service) {
  const base = 'Hello Apply Pannu Bro, I want to apply for:';
  const name = `Service: ${service.name}`;
  const price = `Price: ₹${service.price}`;
  return encodeURIComponent(`${base}\n${name}\n${price}`);
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
  fetch('/api/services')
    .then(res => res.ok ? res.json() : fetch('data/services.json').then(r => r.json()))
    .then(data => {
      const services = data.services || [];
      servicesContainer.innerHTML = '';
      services.forEach(renderServiceCard);
    })
    .catch(err => console.error('Failed to load services for home:', err));
}

function encodeWhatsAppJobMessage(job) {
  const base = 'Hello Apply Pannu Bro, I need more information about:';
  const title = `Job: ${job.title}`;
  return encodeURIComponent(`${base}\n${title}`);
}

function renderJobCard(job) {
  const col = document.createElement('div');
  col.className = 'col-md-4 mb-4';
  col.innerHTML = `
    <div class="card h-100 shadow-sm" style="border-radius: var(--border-radius);">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-2">${job.title}</h5>
        <p class="card-text flex-grow-1" style="min-height:60px;">${job.description}</p>
        <p class="mb-1"><strong>Location:</strong> ${job.location}</p>
        <p class="mb-1"><strong>Posted:</strong> ${job.postedDate}</p>
        <a href="https://wa.me/918525041700?text=${encodeWhatsAppJobMessage(job)}" target="_blank" class="btn btn-primary-custom mt-auto">
          <i class="bi bi-whatsapp me-2"></i>WhatsApp
        </a>
      </div>
    </div>`;
  jobsContainer.appendChild(col);
}

function loadJobs() {
  fetch('/api/jobs')
    .then(res => res.ok ? res.json() : fetch('data/jobs.json').then(r => r.json()))
    .then(data => {
      const jobs = data.jobs || [];
      jobsContainer.innerHTML = '';
      jobs.forEach(renderJobCard);
    })
    .catch(err => console.error('Failed to load jobs for home:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  loadServices();
  loadJobs();
});
