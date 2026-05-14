import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { orgs, activeOrg, setActiveOrg } = useOrg();

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Admin</h1>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/organizations">Organizations</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/roles">Roles</NavLink>
        <NavLink to="/content">Content</NavLink>
      </aside>
      <div className="main">
        <header className="topbar">
          <select
            value={activeOrg?.id ?? ''}
            onChange={(e) => {
              const next = orgs.find((o) => o.id === e.target.value);
              if (next) setActiveOrg(next);
            }}
          >
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{user?.name}</span>
            <button className="secondary" onClick={logout}>Log out</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
