import { useState, useEffect } from 'react';
import api from '../config/api';
import Modal from '../components/ui/Modal';
import { Plus, Thermometer, Droplets, CloudRain, FlaskConical, Waves, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function SensorData() {
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ field_id: '', temperature: '', humidity: '', soil_moisture: '', ph_level: '', rainfall_mm: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFarms(); }, []);
  useEffect(() => { if (selectedFarm) fetchFields(selectedFarm); }, [selectedFarm]);
  useEffect(() => { if (selectedField) fetchSensorData(selectedField); }, [selectedField]);

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
      else { setSelectedField(''); setSensorData([]); }
    } catch (err) { console.error(err); }
  };

  const fetchSensorData = async (fieldId) => {
    try {
      const { data } = await api.get(`/sensor-data/field/${fieldId}?limit=50`);
      setSensorData(data);
    } catch (err) { console.error(err); }
  };

  const latest = sensorData.length > 0 ? sensorData[0] : null;

  const chartData = [...sensorData].reverse().map(d => ({
    time: new Date(d.recorded_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    temperature: parseFloat(d.temperature) || null,
    humidity: parseFloat(d.humidity) || null,
    soil_moisture: parseFloat(d.soil_moisture) || null,
    ph_level: parseFloat(d.ph_level) || null,
    rainfall: parseFloat(d.rainfall_mm) || null,
  }));

  const sensorCards = [
    { label: 'Temperature', value: latest?.temperature, unit: '°C', icon: Thermometer, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Humidity', value: latest?.humidity, unit: '%', icon: Droplets, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Soil Moisture', value: latest?.soil_moisture, unit: '%', icon: Waves, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'pH Level', value: latest?.ph_level, unit: 'pH', icon: FlaskConical, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Rainfall', value: latest?.rainfall_mm, unit: 'mm', icon: CloudRain, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  ];

  const openCreate = () => {
    setForm({ field_id: selectedField, temperature: '', humidity: '', soil_moisture: '', ph_level: '', rainfall_mm: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sensor-data', form);
      setShowModal(false);
      fetchSensorData(selectedField);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sensor Data</h1>
          <p>Monitor environmental conditions across your fields</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} style={{ minWidth: 160 }}>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="form-select" value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ minWidth: 160 }}>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedField}>
            <Plus size={18} /> Add Reading
          </button>
        </div>
      </div>

      {/* Latest Readings Cards */}
      <div className="sensor-grid">
        {sensorCards.map((card, idx) => (
          <div key={card.label} className={`sensor-card stagger-${idx + 1}`}>
            <div className="sensor-card-icon" style={{ background: card.bg }}>
              <card.icon size={24} color={card.color} />
            </div>
            <div className="sensor-card-value">
              {card.value != null ? parseFloat(card.value).toFixed(1) : '—'}
              <span className="sensor-card-unit"> {card.unit}</span>
            </div>
            <div className="sensor-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {chartData.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-card animate-fade-in-up stagger-3">
            <div className="chart-card-title">Temperature & Humidity Trends</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temp (°C)" dot={false} />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card animate-fade-in-up stagger-4">
            <div className="chart-card-title">Soil Moisture & pH Level</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="soil_moisture" stroke="#10b981" strokeWidth={2} name="Soil Moisture (%)" dot={false} />
                <Line type="monotone" dataKey="ph_level" stroke="#8b5cf6" strokeWidth={2} name="pH Level" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Activity size={48} className="empty-state-icon" />
            <h3>No sensor data yet</h3>
            <p>{selectedField ? 'Add sensor readings to start monitoring.' : 'Select a field to view data.'}</p>
          </div>
        </div>
      )}

      {/* History Table */}
      {sensorData.length > 0 && (
        <div className="table-container animate-fade-in-up" style={{ marginTop: '1.5rem' }}>
          <div className="table-toolbar">
            <strong style={{ fontSize: '0.9rem' }}>Reading History</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Soil Moisture (%)</th>
                <th>pH</th>
                <th>Rainfall (mm)</th>
              </tr>
            </thead>
            <tbody>
              {sensorData.slice(0, 20).map(d => (
                <tr key={d.id}>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(d.recorded_at).toLocaleString()}</td>
                  <td>{d.temperature ?? '—'}</td>
                  <td>{d.humidity ?? '—'}</td>
                  <td>{d.soil_moisture ?? '—'}</td>
                  <td>{d.ph_level ?? '—'}</td>
                  <td>{d.rainfall_mm ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Sensor Reading"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Add Reading'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input className="form-input" type="number" step="0.01" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="e.g. 28.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Humidity (%)</label>
              <input className="form-input" type="number" step="0.01" value={form.humidity} onChange={e => setForm({ ...form, humidity: e.target.value })} placeholder="e.g. 65" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Soil Moisture (%)</label>
              <input className="form-input" type="number" step="0.01" value={form.soil_moisture} onChange={e => setForm({ ...form, soil_moisture: e.target.value })} placeholder="e.g. 42" />
            </div>
            <div className="form-group">
              <label className="form-label">pH Level</label>
              <input className="form-input" type="number" step="0.01" value={form.ph_level} onChange={e => setForm({ ...form, ph_level: e.target.value })} placeholder="e.g. 6.5" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Rainfall (mm)</label>
            <input className="form-input" type="number" step="0.01" value={form.rainfall_mm} onChange={e => setForm({ ...form, rainfall_mm: e.target.value })} placeholder="e.g. 12.3" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
