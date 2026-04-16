const statusConfig = {
  // Crop status
  growing: { label: 'Growing', className: 'badge-green' },
  harvested: { label: 'Harvested', className: 'badge-blue' },
  failed: { label: 'Failed', className: 'badge-red' },
  planned: { label: 'Planned', className: 'badge-amber' },
  // Task status
  pending: { label: 'Pending', className: 'badge-amber' },
  in_progress: { label: 'In Progress', className: 'badge-blue' },
  completed: { label: 'Completed', className: 'badge-green' },
  cancelled: { label: 'Cancelled', className: 'badge-gray' },
  // Priority
  low: { label: 'Low', className: 'badge-gray' },
  medium: { label: 'Medium', className: 'badge-amber' },
  high: { label: 'High', className: 'badge-red' },
  urgent: { label: 'Urgent', className: 'badge-red' },
  // Quality
  A: { label: 'Grade A', className: 'badge-green' },
  B: { label: 'Grade B', className: 'badge-blue' },
  C: { label: 'Grade C', className: 'badge-amber' },
  rejected: { label: 'Rejected', className: 'badge-red' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'badge-gray' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}
