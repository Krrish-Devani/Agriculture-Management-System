const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/fields/farm/:farmId
router.get('/farm/:farmId', async (req, res) => {
  try {
    // Verify the farm belongs to this user first
    const { data: farm } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('id', req.params.farmId)
      .eq('owner_id', req.user.id)
      .single();

    if (!farm) return res.status(403).json({ error: 'Access denied' });

    const { data, error } = await supabaseAdmin
      .from('fields')
      .select('*, crops(count)')
      .eq('farm_id', req.params.farmId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Fields fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// GET /api/fields/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('fields')
      .select('*, crops(*), sensor_data(*)')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Field not found' });
    res.json(data);
  } catch (err) {
    console.error('Field fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

// POST /api/fields
router.post('/', async (req, res) => {
  try {
    const { farm_id, name, area_acres, soil_type, irrigation_type } = req.body;

    if (!farm_id || !name || !area_acres) {
      return res.status(400).json({ error: 'Farm ID, name, and area are required' });
    }

    // Verify farm ownership
    const { data: farm } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('id', farm_id)
      .eq('owner_id', req.user.id)
      .single();

    if (!farm) return res.status(403).json({ error: 'Access denied to this farm' });

    const { data, error } = await supabaseAdmin
      .from('fields')
      .insert({ farm_id, name, area_acres: parseFloat(area_acres), soil_type, irrigation_type })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Field create error:', err);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// PUT /api/fields/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, area_acres, soil_type, irrigation_type } = req.body;

    const { data, error } = await supabaseAdmin
      .from('fields')
      .update({ name, area_acres: area_acres ? parseFloat(area_acres) : undefined, soil_type, irrigation_type })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Field update error:', err);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// DELETE /api/fields/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('fields')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error('Field delete error:', err);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

module.exports = router;
