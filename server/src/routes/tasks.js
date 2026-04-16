const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/tasks/farm/:farmId
router.get('/farm/:farmId', async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = supabaseAdmin
      .from('tasks')
      .select('*, profiles(full_name)')
      .eq('farm_id', req.params.farmId)
      .order('due_date', { ascending: true });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Tasks fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/all — all tasks across user's farms
router.get('/all', async (req, res) => {
  try {
    // Get all farm IDs for this user
    const { data: farms } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('owner_id', req.user.id);

    const farmIds = (farms || []).map(f => f.id);
    if (farmIds.length === 0) return res.json([]);

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*, farms(name), profiles(full_name)')
      .in('farm_id', farmIds)
      .order('due_date', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('All tasks fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { farm_id, assigned_to, title, description, category, priority, status, due_date } = req.body;

    if (!farm_id || !title || !due_date) {
      return res.status(400).json({ error: 'Farm ID, title, and due date are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({ farm_id, assigned_to, title, description, category, priority, status, due_date })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('Task create error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { assigned_to, title, description, category, priority, status, due_date } = req.body;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ assigned_to, title, description, category, priority, status, due_date })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Task update error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Task delete error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
