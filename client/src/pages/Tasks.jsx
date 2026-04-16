import { useState, useEffect } from 'react';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Plus, ClipboardList, Calendar } from 'lucide-react';

export default function Tasks() {
  const [farms, setFarms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ farm_id: '', title: '', description: '', category: 'other', priority: 'medium', status: 'pending', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFarms(); }, []);
  useEffect(() => { if (selectedFarm) fetchTasks(selectedFarm); }, [selectedFarm]);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data);
      if (data.length > 0) setSelectedFarm(data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTasks = async (farmId) => {
    try {
      const { data } = await api.get(`/tasks/farm/${farmId}`);
      setTasks(data);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    setEditingTask(null);
    setForm({ farm_id: selectedFarm, title: '', description: '', category: 'other', priority: 'medium', status: 'pending', due_date: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      setShowModal(false);
      fetchTasks(selectedFarm);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const updateStatus = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      fetchTasks(selectedFarm);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks(selectedFarm);
    } catch (err) { console.error(err); }
  };

  const columns = [
    { key: 'pending', label: 'Pending', color: '#f59e0b' },
    { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { key: 'completed', label: 'Completed', color: '#10b981' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage farm operations and assignments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-select" value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} style={{ minWidth: 180 }}>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedFarm}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="task-board animate-fade-in-up">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div className="task-column" key={col.key}>
              <div className="task-column-header">
                <div className="task-column-title">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.label}
                </div>
                <span className="task-column-count">{colTasks.length}</span>
              </div>
              {colTasks.map(task => (
                <div key={task.id} className="task-card" onClick={() => {
                  setEditingTask(task);
                  setForm({
                    farm_id: selectedFarm, title: task.title, description: task.description || '',
                    category: task.category || 'other', priority: task.priority, status: task.status, due_date: task.due_date,
                  });
                  setShowModal(true);
                }}>
                  <div className="task-card-title">
                    <span className={`priority-dot ${task.priority}`} />
                    {task.title}
                  </div>
                  {task.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}
                    </p>
                  )}
                  <div className="task-card-meta">
                    <span className="task-card-category">{task.category || 'other'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Quick status buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.65rem' }}>
                    {col.key !== 'pending' && (
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); updateStatus(task, 'pending'); }} style={{ fontSize: '0.7rem' }}>← Pending</button>
                    )}
                    {col.key !== 'in_progress' && (
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); updateStatus(task, 'in_progress'); }} style={{ fontSize: '0.7rem', color: '#3b82f6' }}>In Progress</button>
                    )}
                    {col.key !== 'completed' && (
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); updateStatus(task, 'completed'); }} style={{ fontSize: '0.7rem', color: '#10b981' }}>✓ Done</button>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No {col.label.toLowerCase()} tasks
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTask ? 'Edit Task' : 'Create Task'}
        footer={<>
          {editingTask && (
            <button className="btn btn-danger btn-sm" onClick={() => { handleDelete(editingTask.id); setShowModal(false); }} style={{ marginRight: 'auto' }}>Delete</button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingTask ? 'Update' : 'Create'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Apply fertilizer to wheat field" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="irrigation">Irrigation</option>
                <option value="fertilizing">Fertilizing</option>
                <option value="pest_control">Pest Control</option>
                <option value="harvesting">Harvesting</option>
                <option value="planting">Planting</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input className="form-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
