import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserOrganizationDTO, UserDTO, Role } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

export const RolesPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UserOrganizationDTO | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('READ');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeOrg?.id],
    queryFn: async () => (await api.get<UserOrganizationDTO[]>(`/orgs/${activeOrg!.id}/members`)).data,
    enabled: !!activeOrg,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-roles'],
    queryFn: async () => (await api.get<UserDTO[]>('/users')).data,
    enabled: !!activeOrg,
  });

  const addMutation = useMutation({
    mutationFn: (data: { userId: string; role: Role }) =>
      api.post(`/orgs/${activeOrg!.id}/members`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.patch(`/orgs/${activeOrg!.id}/members/${userId}`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); close(); },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/orgs/${activeOrg!.id}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });

  const openAdd = () => { setAdding(true); setUserId(''); setRole('READ'); };
  const openEdit = (m: UserOrganizationDTO) => { setEditing(m); setRole(m.role); };
  const close = () => { setAdding(false); setEditing(null); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ userId: editing.userId, role });
    else addMutation.mutate({ userId, role });
  };

  const availableUsers = users.filter((u) => !members.some((m) => m.userId === u.id));

  if (!activeOrg) return <p>Select an organization to manage roles.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Roles (organization members)</h2>
        {canWrite && <button onClick={openAdd}>Add member</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={members}
          rowKey={(m) => m.userId}
          columns={[
            { header: 'User', render: (m) => m.user ? `${m.user.name} (${m.user.email})` : m.userId },
            { header: 'Role', render: (m) => <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span> },
            {
              header: 'Actions',
              render: (m) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(m)}>Change role</button>{' '}
                  <button className="danger" onClick={() => { if (confirm('Remove this member?')) removeMutation.mutate(m.userId); }}>Remove</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={adding || !!editing} title={editing ? 'Change role' : 'Add member'} onClose={close}>
        <form onSubmit={onSubmit}>
          {!editing && (
            <div className="form-field">
              <label>User</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select…</option>
                {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}
          <div className="form-field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="READ">READ (view only)</option>
              <option value="FULL">FULL (CRUD)</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit">{editing ? 'Save' : 'Add'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
