import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import StatsCard from '../components/ui/StatsCard';
import StatusBadge from '../components/ui/StatusBadge';
import {
  Tractor, Sprout, ClipboardList, Package, AlertTriangle,
  BarChart3, TrendingUp, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    farms: 0, crops: 0, pendingTasks: 0, lowStock: 0,
    totalHarvest: 0, totalRevenue: 0,
  });
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [farmsRes, cropsRes, tasksRes, inventoryRes, harvestRes] = await Promise.allSettled([
        api.get('/farms'),
        api.get('/crops/all'),
        api.get('/tasks/all'),
        api.get('/inventory/all'),
        api.get('/harvest-logs/all'),
      ]);

      const farms = farmsRes.status === 'fulfilled' ? farmsRes.value.data : [];
      const allCrops = cropsRes.status === 'fulfilled' ? cropsRes.value.data : [];
      const allTasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data : [];
      const allInventory = inventoryRes.status === 'fulfilled' ? inventoryRes.value.data : [];
      const allHarvests = harvestRes.status === 'fulfilled' ? harvestRes.value.data : [];

      const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
      const lowStock = allInventory.filter(i =>
        i.low_stock_threshold && parseFloat(i.quantity) <= parseFloat(i.low_stock_threshold)
      );

      const totalHarvest = allHarvests.reduce((s, h) => s + parseFloat(h.yield_kg || 0), 0);
      const totalRevenue = allHarvests.reduce((s, h) =>
        s + (parseFloat(h.yield_kg || 0) * parseFloat(h.selling_price_per_kg || 0)), 0
      );

      setStats({
        farms: farms.length,
        crops: allCrops.length,
        pendingTasks: pendingTasks.length,
        lowStock: lowStock.length,
        totalHarvest: Math.round(totalHarvest),
        totalRevenue: Math.round(totalRevenue),
      });

      setCrops(allCrops);
      setTasks(allTasks.slice(0, 5));
      setHarvests(allHarvests);
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crop status pie chart data
  const cropStatusData = ['growing', 'harvested', 'failed', 'planned'].map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: crops.filter(c => c.status === status).length,
  })).filter(d => d.value > 0);

  // Harvest by month chart data
  const harvestByMonth = harvests.reduce((acc, h) => {
    const month = new Date(h.harvest_date).toLocaleDateString('en', { month: 'short', year: '2-digit' });
    const existing = acc.find(a => a.month === month);
    if (existing) {
      existing.yield += parseFloat(h.yield_kg || 0);
      existing.revenue += parseFloat(h.yield_kg || 0) * parseFloat(h.selling_price_per_kg || 0);
    } else {
      acc.push({
        month,
        yield: parseFloat(h.yield_kg || 0),
        revenue: parseFloat(h.yield_kg || 0) * parseFloat(h.selling_price_per_kg || 0),
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="charts-grid">
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 14 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your agricultural operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard icon={Tractor} label="Total Farms" value={stats.farms} color="green" delay={0} />
        <StatsCard icon={Sprout} label="Active Crops" value={stats.crops} color="cyan" delay={1} />
        <StatsCard icon={ClipboardList} label="Pending Tasks" value={stats.pendingTasks} color="amber" delay={2} />
        <StatsCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStock} color="red" delay={3} />
        <StatsCard icon={BarChart3} label="Total Harvest (kg)" value={stats.totalHarvest.toLocaleString()} color="blue" delay={4} />
        <StatsCard icon={TrendingUp} label="Total Revenue (₹)" value={`₹${stats.totalRevenue.toLocaleString()}`} color="purple" delay={5} />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Crop Status Distribution */}
        <div className="chart-card animate-fade-in-up stagger-3">
          <div className="chart-card-title">Crop Status Distribution</div>
          {cropStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={cropStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {cropStatusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No crop data available yet</p>
            </div>
          )}
        </div>

        {/* Harvest Yield Chart */}
        <div className="chart-card animate-fade-in-up stagger-4">
          <div className="chart-card-title">Harvest Yield Over Time</div>
          {harvestByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={harvestByMonth}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="yield" stroke="#10b981" fill="url(#colorYield)" strokeWidth={2} name="Yield (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No harvest data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="chart-card animate-fade-in-up stagger-5" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between mb-2">
          <div className="chart-card-title" style={{ marginBottom: 0 }}>Recent Tasks</div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/tasks')}>View All</button>
        </div>
        {tasks.length > 0 ? (
          <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 600 }}>{task.title}</td>
                    <td><span className="task-card-category">{task.category || 'other'}</span></td>
                    <td><StatusBadge status={task.priority} /></td>
                    <td><StatusBadge status={task.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No tasks yet. Create your first task!</p>
          </div>
        )}
      </div>
    </div>
  );
}
