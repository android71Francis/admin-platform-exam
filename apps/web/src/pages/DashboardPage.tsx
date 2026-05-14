import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';

export const DashboardPage = () => {
  const { activeOrg } = useOrg();
  const { role } = usePermission();

  if (!activeOrg) return <p>No organization selected. Create or join one to get started.</p>;

  return (
    <>
      <div className="page-header"><h2>Dashboard</h2></div>
      <p>Active organization: <strong>{activeOrg.name}</strong></p>
      <p>Your role: <span className={`badge ${role === 'FULL' ? 'badge-full' : 'badge-read'}`}>{role ?? 'None'}</span></p>
      <p>Use the sidebar to manage organizations, teams, users, roles, and content.</p>
    </>
  );
};
