// public/js/jobs.js
// Fetch job updates and render premium job cards

const jobsContainer = document.getElementById('jobs-grid');

// Helper to encode WhatsApp message for job inquiries
function encodeWhatsAppJobMessage(job) {
  const base = 'Hello Apply Pannu Bro, I need more information about:';
  const title = `Job: ${job.title}`;
  const msg = `${base}\n${title}`;
  return encodeURIComponent(msg);
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
  // Try API first, fallback to local JSON file
  fetch('/api/jobs')
    .then(res => res.ok ? res.json() : fetch('data/jobs.json').then(r => r.json()))
    .then(data => {
      const jobs = data.jobs || [];
      jobsContainer.innerHTML = '';
      jobs.forEach(renderJobCard);
    })
    .catch(err => console.error('Failed to load jobs:', err));
}

document.addEventListener('DOMContentLoaded', loadJobs);
