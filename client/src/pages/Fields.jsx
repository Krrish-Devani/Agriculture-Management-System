import { useState, useEffect } from 'react';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Plus, Trash2, Edit, Map } from 'lucide-react';

export default function Fields() {
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [form, setForm] = useState({ farm_id: '', name: '', area_acres: '', soil_type: '', irrigation_type: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFarms(); }, []);

  useEffect(() => {
    if (selectedFarm) fetchFields(selectedFarm);
  }, [selectedFarm]);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarm(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async (farmId) => {
    try {
      const { data } = await api.get(`/fields/farm/${farmId}`);
      setFields(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditingField(null);
    setForm({ farm_id: selectedFarm, name: '', area_acres: '', soil_type: '', irrigation_type: '' });
    setShowModal(true);
  };

  const openEdit = (field) => {
    setEditingField(field);
    setForm({
      farm_id: selectedFarm,
      name: field.name,
      area_acres: field.area_acres,
      soil_type: field.soil_type || '',
      irrigation_type: field.irrigation_type || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingField) {
        await api.put(`/fields/${editingField.id}`, form);
      } else {
        await api.post('/fields', form);
      }
      setShowModal(false);
      fetchFields(selectedFarm);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this field and all its data?')) return;
    try {
      await api.delete(`/fields/${id}`);
      fetchFields(selectedFarm);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fields</h1>
          <p>Manage fields across your farms</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-select" value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} style={{ minWidth: 200 }}>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedFarm}>
            <Plus size={18} /> Add Field
          </button>
        </div>
      </div>

      <div className="table-container animate-fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Field Name</th>
              <th>Area (acres)</th>
              <th>Soil Type</th>
              <th>Irrigation</th>
              <th>Crops</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.length > 0 ? fields.map(field => (
              <tr key={field.id}>
                <td style={{ fontWeight: 600 }}>{field.name}</td>
                <td>{field.area_acres}</td>
                <td>{field.soil_type ? <StatusBadge status={field.soil_type} /> : '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{field.irrigation_type || '—'}</td>
                <td>{field.crops?.[0]?.count || 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(field)}><Edit size={15} /></button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(field.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <Map size={40} className="empty-state-icon" />
                    <h3>No fields yet</h3>
                    <p>Add fields to start tracking your land.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingField ? 'Edit Field' : 'Add New Field'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingField ? 'Update' : 'Create'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Field Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. North Field" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Area (acres) *</label>
              <input className="form-input" type="number" step="0.01" value={form.area_acres} onChange={e => setForm({ ...form, area_acres: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Soil Type</label>
              <select className="form-select" value={form.soil_type} onChange={e => setForm({ ...form, soil_type: e.target.value })}>
                <option value="">Select...</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="silty">Silty</option>
                <option value="peaty">Peaty</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Irrigation Type</label>
            <select className="form-select" value={form.irrigation_type} onChange={e => setForm({ ...form, irrigation_type: e.target.value })}>
              <option value="">Select...</option>
              <option value="drip">Drip</option>
              <option value="sprinkler">Sprinkler</option>
              <option value="flood">Flood</option>
              <option value="none">None</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
