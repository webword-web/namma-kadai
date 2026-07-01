// public/js/admin.js
// Simple admin panel functionality for editing services and jobs

// Utility to create a select element for status
function createStatusSelect(current) {
  const select = document.createElement('select');
  select.className = 'form-select form-select-sm';
  const options = ['Available', 'Coming Soon', 'Not Available'];
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    if (opt === current) option.selected = true;
    select.appendChild(option);
  });
  return select;
}

// Render services table with editable fields
function loadServices() {
  fetch('/api/services')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('services-table');
      container.innerHTML = '';
      const table = document.createElement('table');
      table.className = 'table table-sm';
      const thead = document.createElement('thead');
      thead.innerHTML = `<tr>
        <th>Name</th><th>Tamil</th><th>Description</th><th>Price</th><th>Processing</th><th>Status</th><th>Action</th>
      </tr>`;
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      data.services.forEach(service => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="form-control form-control-sm" value="${service.name}"/></td>
          <td><input type="text" class="form-control form-control-sm" value="${service.tamilName}"/></td>
          <td><input type="text" class="form-control form-control-sm" value="${service.description}"/></td>
          <td><input type="number" class="form-control form-control-sm" value="${service.price}"/></td>
          <td><input type="text" class="form-control form-control-sm" value="${service.processingTime}"/></td>
        `;
        const statusTd = document.createElement('td');
        const statusSelect = createStatusSelect(service.status);
        statusTd.appendChild(statusSelect);
        tr.appendChild(statusTd);
        const actionTd = document.createElement('td');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary btn-sm';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
          const updated = {
            name: tr.children[0].firstChild.value,
            tamilName: tr.children[1].firstChild.value,
            description: tr.children[2].firstChild.value,
            price: Number(tr.children[3].firstChild.value),
            processingTime: tr.children[4].firstChild.value,
            status: statusSelect.value
          };
          fetch(`/api/services/${service.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          })
            .then(r => r.json())
            .then(() => alert('Service updated'))
            .catch(err => console.error(err));
        });
        actionTd.appendChild(saveBtn);
        tr.appendChild(actionTd);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    })
    .catch(err => console.error('Failed to load services', err));
}

// Render jobs table with editable fields
function loadJobs() {
  fetch('/api/jobs')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('jobs-table');
      container.innerHTML = '';
      const table = document.createElement('table');
      table.className = 'table table-sm';
      const thead = document.createElement('thead');
      thead.innerHTML = `<tr>
        <th>Title</th><th>Description</th><th>Location</th><th>Posted</th><th>Action</th>
      </tr>`;
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      data.jobs.forEach(job => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="form-control form-control-sm" value="${job.title}"/></td>
          <td><input type="text" class="form-control form-control-sm" value="${job.description}"/></td>
          <td><input type="text" class="form-control form-control-sm" value="${job.location}"/></td>
          <td><input type="date" class="form-control form-control-sm" value="${job.postedDate}"/></td>
        `;
        const actionTd = document.createElement('td');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary btn-sm';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
          const updated = {
            title: tr.children[0].firstChild.value,
            description: tr.children[1].firstChild.value,
            location: tr.children[2].firstChild.value,
            postedDate: tr.children[3].firstChild.value
          };
          fetch(`/api/jobs/${job.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          })
            .then(r => r.json())
            .then(() => alert('Job updated'))
            .catch(err => console.error(err));
        });
        actionTd.appendChild(saveBtn);
        tr.appendChild(actionTd);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    })
    .catch(err => console.error('Failed to load jobs', err));
}

document.addEventListener('DOMContentLoaded', () => {
  // Load initial data for both tabs
  loadServices();
  loadJobs();

  // Add service button (simple stub – adds empty row)
  const addServiceBtn = document.getElementById('add-service-btn');
  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
      alert('Add Service functionality not implemented in this demo.');
    });
  }
  const addJobBtn = document.getElementById('add-job-btn');
  if (addJobBtn) {
    addJobBtn.addEventListener('click', () => {
      alert('Add Job functionality not implemented in this demo.');
    });
  }
});
