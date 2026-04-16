const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/crops/field/:fieldId
router.get('/field/:fieldId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('crops')
      .select('*, harvest_logs(count)')
      .eq('field_id', req.params.fieldId)
      .order('planting_date', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Crops fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// GET /api/crops/all — all crops for user (across all farms/fields)
router.get('/all', async (req, res) => {
  try {
    // First get all farm IDs belonging to this user
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
      .from('crops')
      .select('*, fields(name, farm_id, farms(name))')
      .in('field_id', fieldIds)
      .order('planting_date', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('All crops fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// GET /api/crops/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('crops')
      .select('*, harvest_logs(*)')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Crop not found' });
    res.json(data);
  } catch (err) {
    console.error('Crop fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch crop' });
  }
});

// POST /api/crops
router.post('/', async (req, res) => {
  try {
    const { field_id, crop_name, variety, planting_date, expected_harvest_date, status, notes } = req.body;

    if (!field_id || !crop_name || !planting_date) {
      return res.status(400).json({ error: 'Field ID, crop name, and planting date are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('crops')
      .insert({ field_id, crop_name, variety, planting_date, expected_harvest_date, status, notes })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Crop create error:', err);
    res.status(500).json({ error: 'Failed to create crop' });
  }
});

// PUT /api/crops/:id
router.put('/:id', async (req, res) => {
  try {
    const { crop_name, variety, planting_date, expected_harvest_date, status, notes } = req.body;

    const { data, error } = await supabaseAdmin
      .from('crops')
      .update({ crop_name, variety, planting_date, expected_harvest_date, status, notes })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Crop update error:', err);
    res.status(500).json({ error: 'Failed to update crop' });
  }
});

// DELETE /api/crops/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('crops')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Crop deleted successfully' });
  } catch (err) {
    console.error('Crop delete error:', err);
    res.status(500).json({ error: 'Failed to delete crop' });
  }
});

module.exports = router;
