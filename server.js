const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read/write JSON data
function readData(file) {
  const filePath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(filePath)) return { [file.split('.')[0]]: [], nextId: 1 };
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function writeData(file, data) {
  const filePath = path.join(__dirname, 'data', file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Services API
app.get('/api/services', (req, res) => {
  const data = readData('services.json');
  res.json(data);
});
app.put('/api/services/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = readData('services.json');
  const idx = data.services.findIndex(s => s.id == id);
  if (idx === -1) return res.status(404).json({ error: 'Service not found' });
  data.services[idx] = { ...data.services[idx], ...updates };
  writeData('services.json', data);
  res.json(data.services[idx]);
});

// Jobs API
app.get('/api/jobs', (req, res) => {
  const data = readData('jobs.json');
  res.json(data);
});
app.post('/api/jobs', (req, res) => {
  const job = req.body;
  const data = readData('jobs.json');
  job.id = data.nextId++;
  data.jobs.push(job);
  writeData('jobs.json', data);
  res.status(201).json(job);
});
app.put('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = readData('jobs.json');
  const idx = data.jobs.findIndex(j => j.id == id);
  if (idx === -1) return res.status(404).json({ error: 'Job not found' });
  data.jobs[idx] = { ...data.jobs[idx], ...updates };
  writeData('jobs.json', data);
  res.json(data.jobs[idx]);
});
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const data = readData('jobs.json');
  const filtered = data.jobs.filter(j => j.id != id);
  if (filtered.length === data.jobs.length) return res.status(404).json({ error: 'Job not found' });
  data.jobs = filtered;
  writeData('jobs.json', data);
  res.status(204).end();
});

// Simple analytics endpoint
app.post('/api/track/:type', (req, res) => {
  const { type } = req.params;
  const analyticsPath = path.join(__dirname, 'data', 'analytics.json');
  let analytics = {};
  if (fs.existsSync(analyticsPath)) analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
  analytics[type] = (analytics[type] || 0) + 1;
  fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2), 'utf8');
  res.json({ [type]: analytics[type] });
});

app.listen(PORT, () => console.log(Server running on http://localhost:));
