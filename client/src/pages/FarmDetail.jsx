import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import StatsCard from '../components/ui/StatsCard';
import StatusBadge from '../components/ui/StatusBadge';
import { MapPin, Maximize2, Sprout, Map, ClipboardList, Package, ArrowLeft } from 'lucide-react';

export default function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [fields, setFields] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState('fields');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarmData();
  }, [id]);

  const fetchFarmData = async () => {
    try {
      const [farmRes, fieldsRes, tasksRes, invRes] = await Promise.allSettled([
        api.get(`/farms/${id}`),
        api.get(`/fields/farm/${id}`),
        api.get(`/tasks/farm/${id}`),
        api.get(`/inventory/farm/${id}`),
      ]);

      if (farmRes.status === 'fulfilled') setFarm(farmRes.value.data);
      if (fieldsRes.status === 'fulfilled') setFields(fieldsRes.value.data);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data);
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data);
    } catch (err) {
      console.error('Error fetching farm data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }} />
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="empty-state" style={{ minHeight: 400 }}>
        <h3>Farm not found</h3>
        <button className="btn btn-primary mt-2" onClick={() => navigate('/farms')}>Back to Farms</button>
      </div>
    );
  }

  const tabs = [
    { key: 'fields', label: 'Fields', icon: Map, count: fields.length },
    { key: 'tasks', label: 'Tasks', icon: ClipboardList, count: tasks.length },
    { key: 'inventory', label: 'Inventory', icon: Package, count: inventory.length },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-1" onClick={() => navigate('/farms')} style={{ marginLeft: '-0.5rem' }}>
            <ArrowLeft size={16} /> Back to Farms
          </button>
          <h1>{farm.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
            <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={14} /> {farm.location}
            </span>
            <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Maximize2 size={14} /> {farm.total_area_acres} acres
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard icon={Map} label="Fields" value={fields.length} color="green" delay={0} />
        <StatsCard icon={Sprout} label="Total Crops" value={fields.reduce((s, f) => s + (f.crops?.[0]?.count || 0), 0)} color="cyan" delay={1} />
        <StatsCard icon={ClipboardList} label="Active Tasks" value={tasks.filter(t => t.status !== 'completed').length} color="amber" delay={2} />
        <StatsCard icon={Package} label="Inventory Items" value={inventory.length} color="purple" delay={3} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-ghost`}
            style={{
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              borderRadius: 0,
              color: activeTab === tab.key ? 'var(--color-primary-700)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 600 : 500,
              paddingBottom: '0.75rem',
            }}
          >
            <tab.icon size={16} /> {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'fields' && (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Area (acres)</th>
                <th>Soil Type</th>
                <th>Irrigation</th>
                <th>Crops</th>
              </tr>
            </thead>
            <tbody>
              {fields.length > 0 ? fields.map(field => (
                <tr key={field.id}>
                  <td style={{ fontWeight: 600 }}>{field.name}</td>
                  <td>{field.area_acres}</td>
                  <td><StatusBadge status={field.soil_type || 'N/A'} /></td>
                  <td style={{ textTransform: 'capitalize' }}>{field.irrigation_type || 'None'}</td>
                  <td>{field.crops?.[0]?.count || 0}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No fields yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? tasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 600 }}>{task.title}</td>
                  <td><span className="task-card-category">{task.category || 'other'}</span></td>
                  <td><StatusBadge status={task.priority} /></td>
                  <td><StatusBadge status={task.status} /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tasks yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length > 0 ? inventory.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                  <td><span className="task-card-category">{item.category || 'other'}</span></td>
                  <td style={{
                    color: item.low_stock_threshold && parseFloat(item.quantity) <= parseFloat(item.low_stock_threshold)
                      ? 'var(--color-error)' : 'inherit',
                    fontWeight: item.low_stock_threshold && parseFloat(item.quantity) <= parseFloat(item.low_stock_threshold)
                      ? 700 : 400,
                  }}>
                    {item.quantity}
                  </td>
                  <td>{item.unit}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.supplier || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No inventory items yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
