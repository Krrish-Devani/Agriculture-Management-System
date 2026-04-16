import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import { Plus, MapPin, Maximize2, Trash2, Edit, Tractor } from 'lucide-react';

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', total_area_acres: '', description: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchFarms(); }, []);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data);
    } catch (err) {
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingFarm(null);
    setForm({ name: '', location: '', total_area_acres: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (farm, e) => {
    e.stopPropagation();
    setEditingFarm(farm);
    setForm({
      name: farm.name,
      location: farm.location,
      total_area_acres: farm.total_area_acres,
      description: farm.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFarm) {
        await api.put(`/farms/${editingFarm.id}`, form);
      } else {
        await api.post('/farms', form);
      }
      setShowModal(false);
      fetchFarms();
    } catch (err) {
      console.error('Error saving farm:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this farm? All associated data will be lost.')) return;
    try {
      await api.delete(`/farms/${id}`);
      fetchFarms();
    } catch (err) {
      console.error('Error deleting farm:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><div><h1>Farms</h1></div></div>
        <div className="grid-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 160 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Farms</h1>
          <p>Manage your agricultural properties</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-farm-btn">
          <Plus size={18} /> Add Farm
        </button>
      </div>

      {farms.length > 0 ? (
        <div className="grid-2">
          {farms.map((farm, idx) => (
            <div
              key={farm.id}
              className={`farm-card animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
              onClick={() => navigate(`/farms/${farm.id}`)}
            >
              <div className="flex-between mb-1">
                <div className="farm-card-name">{farm.name}</div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => openEdit(farm, e)}>
                    <Edit size={15} />
                  </button>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => handleDelete(farm.id, e)} style={{ color: 'var(--color-error)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="farm-card-location">
                <MapPin size={14} /> {farm.location}
              </div>
              <div className="farm-card-stats">
                <div className="farm-card-stat">
                  <div className="farm-card-stat-value">{farm.total_area_acres}</div>
                  <div className="farm-card-stat-label">Acres</div>
                </div>
                <div className="farm-card-stat">
                  <div className="farm-card-stat-value">{farm.fields?.[0]?.count || 0}</div>
                  <div className="farm-card-stat-label">Fields</div>
                </div>
              </div>
              {farm.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                  {farm.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Tractor size={48} className="empty-state-icon" />
            <h3>No farms yet</h3>
            <p>Create your first farm to start managing your agricultural operations.</p>
            <button className="btn btn-primary mt-2" onClick={openCreate}>
              <Plus size={18} /> Create Farm
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFarm ? 'Edit Farm' : 'Create New Farm'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingFarm ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Farm Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Green Valley Farm" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required placeholder="e.g. Punjab, India" />
            </div>
            <div className="form-group">
              <label className="form-label">Total Area (acres) *</label>
              <input className="form-input" type="number" step="0.01" value={form.total_area_acres} onChange={e => setForm({ ...form, total_area_acres: e.target.value })} required placeholder="e.g. 50" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the farm..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
