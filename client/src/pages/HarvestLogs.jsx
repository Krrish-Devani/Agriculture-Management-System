import { useState, useEffect } from 'react';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import StatsCard from '../components/ui/StatsCard';
import { Plus, Trash2, Edit, BarChart3, TrendingUp, Award, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function HarvestLogs() {
  const [harvests, setHarvests] = useState([]);
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [form, setForm] = useState({ crop_id: '', harvest_date: '', yield_kg: '', quality_grade: 'A', selling_price_per_kg: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [hRes, cRes, fRes] = await Promise.allSettled([
        api.get('/harvest-logs/all'),
        api.get('/crops/all'),
        api.get('/farms'),
      ]);
      if (hRes.status === 'fulfilled') setHarvests(hRes.value.data);
      if (cRes.status === 'fulfilled') setCrops(cRes.value.data);
      if (fRes.status === 'fulfilled') setFarms(fRes.value.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalYield = harvests.reduce((s, h) => s + parseFloat(h.yield_kg || 0), 0);
  const totalRevenue = harvests.reduce((s, h) => s + (parseFloat(h.yield_kg || 0) * parseFloat(h.selling_price_per_kg || 0)), 0);
  const avgPrice = harvests.length > 0
    ? harvests.reduce((s, h) => s + parseFloat(h.selling_price_per_kg || 0), 0) / harvests.filter(h => h.selling_price_per_kg).length
    : 0;

  const gradeData = ['A', 'B', 'C', 'rejected'].map(g => ({
    name: g === 'rejected' ? 'Rejected' : `Grade ${g}`,
    value: harvests.filter(h => h.quality_grade === g).length,
  })).filter(d => d.value > 0);

  const yieldByCrop = harvests.reduce((acc, h) => {
    const cropName = h.crops?.crop_name || 'Unknown';
    const existing = acc.find(a => a.crop === cropName);
    if (existing) existing.yield += parseFloat(h.yield_kg || 0);
    else acc.push({ crop: cropName, yield: parseFloat(h.yield_kg || 0) });
    return acc;
  }, []);

  const openCreate = () => {
    setEditingLog(null);
    setForm({ crop_id: crops[0]?.id || '', harvest_date: '', yield_kg: '', quality_grade: 'A', selling_price_per_kg: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setForm({
      crop_id: log.crop_id, harvest_date: log.harvest_date, yield_kg: log.yield_kg,
      quality_grade: log.quality_grade || 'A', selling_price_per_kg: log.selling_price_per_kg || '', notes: log.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLog) await api.put(`/harvest-logs/${editingLog.id}`, form);
      else await api.post('/harvest-logs', form);
      setShowModal(false);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this harvest log?')) return;
    try { await api.delete(`/harvest-logs/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><div><h1>Harvest Logs</h1></div></div>
        <div className="stats-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Harvest Logs</h1>
          <p>Track yields, quality, and revenue from harvests</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={crops.length === 0}>
          <Plus size={18} /> Log Harvest
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <StatsCard icon={BarChart3} label="Total Harvests" value={harvests.length} color="green" delay={0} />
        <StatsCard icon={TrendingUp} label="Total Yield" value={`${Math.round(totalYield).toLocaleString()} kg`} color="blue" delay={1} />
        <StatsCard icon={DollarSign} label="Total Revenue" value={`₹${Math.round(totalRevenue).toLocaleString()}`} color="purple" delay={2} />
        <StatsCard icon={Award} label="Avg Price/kg" value={`₹${avgPrice.toFixed(2)}`} color="amber" delay={3} />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card animate-fade-in-up stagger-3">
          <div className="chart-card-title">Yield by Crop</div>
          {yieldByCrop.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yieldByCrop}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="crop" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="yield" fill="#10b981" radius={[6, 6, 0, 0]} name="Yield (kg)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}><p>No data yet</p></div>
          )}
        </div>

        <div className="chart-card animate-fade-in-up stagger-4">
          <div className="chart-card-title">Quality Distribution</div>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={gradeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}><p>No data yet</p></div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container animate-fade-in-up">
        <div className="table-toolbar">
          <strong style={{ fontSize: '0.9rem' }}>All Harvest Logs</strong>
        </div>
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Harvest Date</th>
              <th>Yield (kg)</th>
              <th>Quality</th>
              <th>Price/kg</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {harvests.length > 0 ? harvests.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 600 }}>{h.crops?.crop_name || '—'}</td>
                <td>{new Date(h.harvest_date).toLocaleDateString()}</td>
                <td>{parseFloat(h.yield_kg).toLocaleString()}</td>
                <td><StatusBadge status={h.quality_grade} /></td>
                <td>₹{h.selling_price_per_kg || '—'}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>
                  ₹{h.selling_price_per_kg ? Math.round(parseFloat(h.yield_kg) * parseFloat(h.selling_price_per_kg)).toLocaleString() : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(h)}><Edit size={15} /></button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(h.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <BarChart3 size={40} className="empty-state-icon" />
                    <h3>No harvest logs yet</h3>
                    <p>Log your first harvest to start tracking yields.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingLog ? 'Edit Harvest Log' : 'Log Harvest'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingLog ? 'Update' : 'Log'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Crop *</label>
            <select className="form-select" value={form.crop_id} onChange={e => setForm({ ...form, crop_id: e.target.value })} required>
              <option value="">Select crop...</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.crop_name} — {c.variety || 'N/A'}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Harvest Date *</label>
              <input className="form-input" type="date" value={form.harvest_date} onChange={e => setForm({ ...form, harvest_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Yield (kg) *</label>
              <input className="form-input" type="number" step="0.01" value={form.yield_kg} onChange={e => setForm({ ...form, yield_kg: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quality Grade</label>
              <select className="form-select" value={form.quality_grade} onChange={e => setForm({ ...form, quality_grade: e.target.value })}>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price / kg (₹)</label>
              <input className="form-input" type="number" step="0.01" value={form.selling_price_per_kg} onChange={e => setForm({ ...form, selling_price_per_kg: e.target.value })} placeholder="e.g. 25.00" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Quality notes, buyer info, etc." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
