export default function StatsCard({ icon: Icon, label, value, color = 'green', delay = 0 }) {
  return (
    <div className={`stat-card stagger-${delay + 1}`} style={{ animationDelay: `${delay * 0.08}s` }}>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}
