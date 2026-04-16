const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/inventory/farm/:farmId
router.get('/farm/:farmId', async (req, res) => {
  try {
    const { category } = req.query;
    let query = supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('farm_id', req.params.farmId)
      .order('item_name', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/all
router.get('/all', async (req, res) => {
  try {
    const { data: farms } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('owner_id', req.user.id);

    const farmIds = (farms || []).map(f => f.id);
    if (farmIds.length === 0) return res.json([]);

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select('*, farms(name)')
      .in('farm_id', farmIds)
      .order('item_name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('All inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const { farm_id, item_name, category, quantity, unit, low_stock_threshold, supplier } = req.body;

    if (!farm_id || !item_name || quantity === undefined || !unit) {
      return res.status(400).json({ error: 'Farm ID, item name, quantity, and unit are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert({ farm_id, item_name, category, quantity: parseFloat(quantity), unit, low_stock_threshold, supplier })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Inventory create error:', err);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  try {
    const { item_name, category, quantity, unit, low_stock_threshold, supplier } = req.body;

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .update({ item_name, category, quantity: quantity !== undefined ? parseFloat(quantity) : undefined, unit, low_stock_threshold, supplier })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Inventory update error:', err);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('inventory')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error('Inventory delete error:', err);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

module.exports = router;
