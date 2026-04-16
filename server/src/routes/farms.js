const express = require('express');
const router = express.Router();

// GET /api/farms — list user's farms
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('farms')
      .select('*, fields(count)')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Farms fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

// GET /api/farms/:id — single farm with related data counts
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('farms')
      .select('*, fields(id, name, area_acres, soil_type, irrigation_type)')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Farm not found' });
    res.json(data);
  } catch (err) {
    console.error('Farm fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch farm' });
  }
});

// POST /api/farms — create a farm
router.post('/', async (req, res) => {
  try {
    const { name, location, total_area_acres, description } = req.body;

    if (!name || !location || !total_area_acres) {
      return res.status(400).json({ error: 'Name, location, and total area are required' });
    }

    const { data, error } = await req.supabase
      .from('farms')
      .insert({
        name,
        location,
        total_area_acres,
        description,
        owner_id: req.user.id,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Farm create error:', err);
    res.status(500).json({ error: 'Failed to create farm' });
  }
});

// PUT /api/farms/:id — update a farm
router.put('/:id', async (req, res) => {
  try {
    const { name, location, total_area_acres, description } = req.body;

    const { data, error } = await req.supabase
      .from('farms')
      .update({ name, location, total_area_acres, description })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Farm update error:', err);
    res.status(500).json({ error: 'Failed to update farm' });
  }
});

// DELETE /api/farms/:id — delete a farm
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('farms')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Farm deleted successfully' });
  } catch (err) {
    console.error('Farm delete error:', err);
    res.status(500).json({ error: 'Failed to delete farm' });
  }
});

module.exports = router;
