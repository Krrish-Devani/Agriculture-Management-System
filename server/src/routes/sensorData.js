const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/sensor-data/field/:fieldId
router.get('/field/:fieldId', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data, error } = await supabaseAdmin
      .from('sensor_data')
      .select('*')
      .eq('field_id', req.params.fieldId)
      .order('recorded_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Sensor data fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// GET /api/sensor-data/all — all sensor data for user
router.get('/all', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const { data: farms } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('owner_id', req.user.id);

    const farmIds = (farms || []).map(f => f.id);
    if (farmIds.length === 0) return res.json([]);

    const { data: fields } = await supabaseAdmin
      .from('fields')
      .select('id')
      .in('farm_id', farmIds);

    const fieldIds = (fields || []).map(f => f.id);
    if (fieldIds.length === 0) return res.json([]);

    const { data, error } = await supabaseAdmin
      .from('sensor_data')
      .select('*, fields(name, farm_id, farms(name))')
      .in('field_id', fieldIds)
      .order('recorded_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('All sensor data fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// GET /api/sensor-data/latest/:fieldId — latest reading for a field
router.get('/latest/:fieldId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sensor_data')
      .select('*')
      .eq('field_id', req.params.fieldId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return res.status(404).json({ error: 'No sensor data found' });
    res.json(data);
  } catch (err) {
    console.error('Latest sensor data error:', err);
    res.status(500).json({ error: 'Failed to fetch latest sensor data' });
  }
});

// POST /api/sensor-data
router.post('/', async (req, res) => {
  try {
    const { field_id, temperature, humidity, soil_moisture, ph_level, rainfall_mm } = req.body;

    if (!field_id) {
      return res.status(400).json({ error: 'Field ID is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('sensor_data')
      .insert({ field_id, temperature, humidity, soil_moisture, ph_level, rainfall_mm })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Sensor data create error:', err);
    res.status(500).json({ error: 'Failed to create sensor data' });
  }
});

// DELETE /api/sensor-data/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('sensor_data')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Sensor data deleted successfully' });
  } catch (err) {
    console.error('Sensor data delete error:', err);
    res.status(500).json({ error: 'Failed to delete sensor data' });
  }
});

module.exports = router;
