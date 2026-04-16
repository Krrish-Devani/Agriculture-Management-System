import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Tractor, Map, Sprout, ClipboardList,
  Package, Activity, BarChart3, LogOut, Leaf, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { section: 'Farm Management' },
  { label: 'Farms', path: '/farms', icon: Tractor },
  { label: 'Fields', path: '/fields', icon: Map },
  { label: 'Crops', path: '/crops', icon: Sprout },
  { section: 'Operations' },
  { label: 'Tasks', path: '/tasks', icon: ClipboardList },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { section: 'Monitoring' },
  { label: 'Sensor Data', path: '/sensors', icon: Activity },
  { label: 'Harvest Logs', path: '/harvests', icon: BarChart3 },
];

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-icon btn-ghost"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 200,
          display: 'none',
        }}
        id="sidebar-toggle"
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Leaf size={22} color="white" />
          </div>
          <span className="sidebar-brand">AgriManager</span>
          {mobileOpen && (
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setMobileOpen(false)}
              style={{ marginLeft: 'auto', color: 'white' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) =>
            item.section ? (
              <div key={idx} className="sidebar-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={20} className="sidebar-link-icon" />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.full_name || 'User'}</div>
              <div className="sidebar-user-role">{profile?.role || 'farmer'}</div>
            </div>
            <button
              className="btn btn-icon btn-ghost"
              onClick={logout}
              title="Logout"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
