const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/harvest-logs/crop/:cropId
router.get('/crop/:cropId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('harvest_logs')
      .select('*')
      .eq('crop_id', req.params.cropId)
      .order('harvest_date', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Harvest logs fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch harvest logs' });
  }
});

// GET /api/harvest-logs/all — all harvest logs for user
router.get('/all', async (req, res) => {
  try {
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

    const { data: crops } = await supabaseAdmin
      .from('crops')
      .select('id')
      .in('field_id', fieldIds);

    const cropIds = (crops || []).map(c => c.id);
    if (cropIds.length === 0) return res.json([]);

    const { data, error } = await supabaseAdmin
      .from('harvest_logs')
      .select('*, crops(crop_name, field_id, fields(name, farm_id, farms(name)))')
      .in('crop_id', cropIds)
      .order('harvest_date', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('All harvest logs fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch harvest logs' });
  }
});

// GET /api/harvest-logs/summary — aggregate yield and revenue
router.get('/summary', async (req, res) => {
  try {
    const { data: farms } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('owner_id', req.user.id);

    const farmIds = (farms || []).map(f => f.id);
    if (farmIds.length === 0) {
      return res.json({ total_harvests: 0, total_yield_kg: 0, total_revenue: 0, grade_distribution: { A: 0, B: 0, C: 0, rejected: 0 } });
    }

    const { data: fields } = await supabaseAdmin
      .from('fields')
      .select('id')
      .in('farm_id', farmIds);

    const fieldIds = (fields || []).map(f => f.id);
    if (fieldIds.length === 0) {
      return res.json({ total_harvests: 0, total_yield_kg: 0, total_revenue: 0, grade_distribution: { A: 0, B: 0, C: 0, rejected: 0 } });
    }

    const { data: crops } = await supabaseAdmin
      .from('crops')
      .select('id')
      .in('field_id', fieldIds);

    const cropIds = (crops || []).map(c => c.id);
    if (cropIds.length === 0) {
      return res.json({ total_harvests: 0, total_yield_kg: 0, total_revenue: 0, grade_distribution: { A: 0, B: 0, C: 0, rejected: 0 } });
    }

    const { data, error } = await supabaseAdmin
      .from('harvest_logs')
      .select('yield_kg, selling_price_per_kg, quality_grade')
      .in('crop_id', cropIds);

    if (error) return res.status(400).json({ error: error.message });

    const summary = {
      total_harvests: data.length,
      total_yield_kg: data.reduce((sum, h) => sum + parseFloat(h.yield_kg || 0), 0),
      total_revenue: data.reduce((sum, h) => sum + (parseFloat(h.yield_kg || 0) * parseFloat(h.selling_price_per_kg || 0)), 0),
      grade_distribution: { A: 0, B: 0, C: 0, rejected: 0 },
    };

    data.forEach(h => {
      if (h.quality_grade && summary.grade_distribution[h.quality_grade] !== undefined) {
        summary.grade_distribution[h.quality_grade]++;
      }
    });

    res.json(summary);
  } catch (err) {
    console.error('Harvest summary error:', err);
    res.status(500).json({ error: 'Failed to fetch harvest summary' });
  }
});

// POST /api/harvest-logs
router.post('/', async (req, res) => {
  try {
    const { crop_id, harvest_date, yield_kg, quality_grade, selling_price_per_kg, notes } = req.body;

    if (!crop_id || !harvest_date || !yield_kg) {
      return res.status(400).json({ error: 'Crop ID, harvest date, and yield are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('harvest_logs')
      .insert({ crop_id, harvest_date, yield_kg: parseFloat(yield_kg), quality_grade, selling_price_per_kg: selling_price_per_kg ? parseFloat(selling_price_per_kg) : null, notes })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Harvest log create error:', err);
    res.status(500).json({ error: 'Failed to create harvest log' });
  }
});

// PUT /api/harvest-logs/:id
router.put('/:id', async (req, res) => {
  try {
    const { harvest_date, yield_kg, quality_grade, selling_price_per_kg, notes } = req.body;

    const { data, error } = await supabaseAdmin
      .from('harvest_logs')
      .update({ harvest_date, yield_kg: yield_kg ? parseFloat(yield_kg) : undefined, quality_grade, selling_price_per_kg: selling_price_per_kg ? parseFloat(selling_price_per_kg) : undefined, notes })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Harvest log update error:', err);
    res.status(500).json({ error: 'Failed to update harvest log' });
  }
});

// DELETE /api/harvest-logs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('harvest_logs')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Harvest log deleted successfully' });
  } catch (err) {
    console.error('Harvest log delete error:', err);
    res.status(500).json({ error: 'Failed to delete harvest log' });
  }
});

module.exports = router;
