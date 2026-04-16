import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const pageTitles = {
  '/': 'Dashboard',
  '/farms': 'Farms',
  '/fields': 'Fields',
  '/crops': 'Crops',
  '/tasks': 'Tasks',
  '/inventory': 'Inventory',
  '/sensors': 'Sensor Data',
  '/harvests': 'Harvest Logs',
};

export default function Topbar() {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.startsWith('/farms/')) return 'Farm Details';
    return pageTitles[location.pathname] || 'AgriManager';
  };

  return (
    <header className="topbar">
      <h2 className="topbar-title">{getTitle()}</h2>
      <div className="topbar-actions">
        <button className="btn btn-icon btn-ghost" title="Notifications">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
