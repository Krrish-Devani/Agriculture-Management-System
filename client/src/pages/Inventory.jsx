import { useState, useEffect } from 'react';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit, Package, AlertTriangle, Search } from 'lucide-react';

export default function Inventory() {
  const [farms, setFarms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ farm_id: '', item_name: '', category: 'seed', quantity: '', unit: '', low_stock_threshold: '', supplier: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFarms(); }, []);
  useEffect(() => { if (selectedFarm) fetchInventory(selectedFarm); }, [selectedFarm]);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data);
      if (data.length > 0) setSelectedFarm(data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchInventory = async (farmId) => {
    try {
      const { data } = await api.get(`/inventory/farm/${farmId}`);
      setInventory(data);
    } catch (err) { console.error(err); }
  };

  const categories = ['seed', 'fertilizer', 'pesticide', 'equipment', 'fuel', 'other'];

  const filtered = inventory.filter(i => {
    const matchesSearch = !search || i.item_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !filterCat || i.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const lowStockCount = inventory.filter(i => i.low_stock_threshold && parseFloat(i.quantity) <= parseFloat(i.low_stock_threshold)).length;

  const openCreate = () => {
    setEditingItem(null);
    setForm({ farm_id: selectedFarm, item_name: '', category: 'seed', quantity: '', unit: '', low_stock_threshold: '', supplier: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      farm_id: selectedFarm, item_name: item.item_name, category: item.category || 'other',
      quantity: item.quantity, unit: item.unit, low_stock_threshold: item.low_stock_threshold || '', supplier: item.supplier || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) await api.put(`/inventory/${editingItem.id}`, form);
      else await api.post('/inventory', form);
      setShowModal(false);
      fetchInventory(selectedFarm);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try { await api.delete(`/inventory/${id}`); fetchInventory(selectedFarm); } catch (err) { console.error(err); }
  };

  const isLowStock = (item) => item.low_stock_threshold && parseFloat(item.quantity) <= parseFloat(item.low_stock_threshold);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Track supplies, seeds, equipment, and more</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-select" value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} style={{ minWidth: 180 }}>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedFarm}>
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="animate-fade-in-down" style={{
          background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.875rem', color: '#92400e',
        }}>
          <AlertTriangle size={18} />
          <strong>{lowStockCount} item{lowStockCount > 1 ? 's' : ''}</strong> below low stock threshold
        </div>
      )}

      <div className="table-container animate-fade-in-up">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={16} color="var(--text-muted)" />
            <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <button className={`table-filter-btn ${!filterCat ? 'active' : ''}`} onClick={() => setFilterCat('')}>All</button>
            {categories.map(c => (
              <button key={c} className={`table-filter-btn ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)} style={{ textTransform: 'capitalize' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Threshold</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(item => (
              <tr key={item.id} style={isLowStock(item) ? { background: '#fef2f2' } : {}}>
                <td style={{ fontWeight: 600 }}>
                  {isLowStock(item) && <AlertTriangle size={14} style={{ color: 'var(--color-error)', marginRight: 6, verticalAlign: 'middle' }} />}
                  {item.item_name}
                </td>
                <td><span className="task-card-category" style={{ textTransform: 'capitalize' }}>{item.category}</span></td>
                <td style={{ fontWeight: isLowStock(item) ? 700 : 400, color: isLowStock(item) ? 'var(--color-error)' : 'inherit' }}>{item.quantity}</td>
                <td>{item.unit}</td>
                <td style={{ color: 'var(--text-muted)' }}>{item.low_stock_threshold || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.supplier || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(item)}><Edit size={15} /></button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Package size={40} className="empty-state-icon" />
                    <h3>No inventory items</h3>
                    <p>Add items to track your farm supplies.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Item' : 'Add Inventory Item'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Update' : 'Add'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} required placeholder="e.g. Urea Fertilizer" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit *</label>
              <input className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required placeholder="e.g. kg, liters, bags" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input className="form-input" type="number" step="0.01" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} placeholder="Alert at..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input className="form-input" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
