require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const farmsRoutes = require('./routes/farms');
const fieldsRoutes = require('./routes/fields');
const cropsRoutes = require('./routes/crops');
const tasksRoutes = require('./routes/tasks');
const inventoryRoutes = require('./routes/inventory');
const sensorDataRoutes = require('./routes/sensorData');
const harvestLogsRoutes = require('./routes/harvestLogs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', authMiddleware, farmsRoutes);
app.use('/api/fields', authMiddleware, fieldsRoutes);
app.use('/api/crops', authMiddleware, cropsRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/sensor-data', authMiddleware, sensorDataRoutes);
app.use('/api/harvest-logs', authMiddleware, harvestLogsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🌾 AgriManager API running on http://localhost:${PORT}`);
});
