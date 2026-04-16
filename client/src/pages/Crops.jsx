import { useState, useEffect } from 'react';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Plus, Trash2, Edit, Sprout } from 'lucide-react';

export default function Crops() {
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [form, setForm] = useState({ field_id: '', crop_name: '', variety: '', planting_date: '', expected_harvest_date: '', status: 'growing', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFarms(); }, []);

  useEffect(() => {
    if (selectedFarm) fetchFields(selectedFarm);
  }, [selectedFarm]);

  useEffect(() => {
    if (selectedField) fetchCrops(selectedField);
  }, [selectedField]);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data);
      if (data.length > 0) setSelectedFarm(data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchFields = async (farmId) => {
    try {
      const { data } = await api.get(`/fields/farm/${farmId}`);
      setFields(data);
      if (data.length > 0) setSelectedField(data[0].id);
      else { setSelectedField(''); setCrops([]); }
    } catch (err) { console.error(err); }
  };

  const fetchCrops = async (fieldId) => {
    try {
      const { data } = await api.get(`/crops/field/${fieldId}`);
      setCrops(data);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    setEditingCrop(null);
    setForm({ field_id: selectedField, crop_name: '', variety: '', planting_date: '', expected_harvest_date: '', status: 'growing', notes: '' });
    setShowModal(true);
  };

  const openEdit = (crop) => {
    setEditingCrop(crop);
    setForm({
      field_id: selectedField,
      crop_name: crop.crop_name,
      variety: crop.variety || '',
      planting_date: crop.planting_date,
      expected_harvest_date: crop.expected_harvest_date || '',
      status: crop.status,
      notes: crop.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCrop) {
        await api.put(`/crops/${editingCrop.id}`, form);
      } else {
        await api.post('/crops', form);
      }
      setShowModal(false);
      fetchCrops(selectedField);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this crop record?')) return;
    try {
      await api.delete(`/crops/${id}`);
      fetchCrops(selectedField);
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Crops</h1>
          <p>Track crop lifecycle from planting to harvest</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} style={{ minWidth: 160 }}>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="form-select" value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ minWidth: 160 }}>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedField}>
            <Plus size={18} /> Add Crop
          </button>
        </div>
      </div>

      <div className="table-container animate-fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Crop Name</th>
              <th>Variety</th>
              <th>Planting Date</th>
              <th>Expected Harvest</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {crops.length > 0 ? crops.map(crop => (
              <tr key={crop.id}>
                <td style={{ fontWeight: 600 }}>{crop.crop_name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{crop.variety || '—'}</td>
                <td>{new Date(crop.planting_date).toLocaleDateString()}</td>
                <td>{crop.expected_harvest_date ? new Date(crop.expected_harvest_date).toLocaleDateString() : '—'}</td>
                <td><StatusBadge status={crop.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(crop)}><Edit size={15} /></button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(crop.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <Sprout size={40} className="empty-state-icon" />
                    <h3>No crops yet</h3>
                    <p>{selectedField ? 'Add crops to this field.' : 'Select a field first.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCrop ? 'Edit Crop' : 'Add New Crop'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingCrop ? 'Update' : 'Create'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Crop Name *</label>
              <input className="form-input" value={form.crop_name} onChange={e => setForm({ ...form, crop_name: e.target.value })} required placeholder="e.g. Wheat" />
            </div>
            <div className="form-group">
              <label className="form-label">Variety</label>
              <input className="form-input" value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} placeholder="e.g. HD-2967" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Planting Date *</label>
              <input className="form-input" type="date" value={form.planting_date} onChange={e => setForm({ ...form, planting_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Harvest</label>
              <input className="form-input" type="date" value={form.expected_harvest_date} onChange={e => setForm({ ...form, expected_harvest_date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="planned">Planned</option>
              <option value="growing">Growing</option>
              <option value="harvested">Harvested</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
