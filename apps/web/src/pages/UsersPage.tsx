import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserDTO } from '@admin-platform-exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

interface UserFormState {
  email: string;
  name: string;
  password: string;
}

const empty: UserFormState = { email: '', name: '', password: '' };

export const UsersPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<UserFormState>(empty);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<UserDTO[]>('/users')).data,
    enabled: !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormState) => api.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormState> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const openCreate = () => { setCreating(true); setForm(empty); };
  const openEdit = (u: UserDTO) => { setEditing(u); setForm({ email: u.email, name: u.name, password: '' }); };
  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      const patch: Partial<UserFormState> = { email: form.email, name: form.name };
      if (form.password) patch.password = form.password;
      updateMutation.mutate({ id: editing.id, data: patch });
    } else {
      createMutation.mutate(form);
    }
  };

  if (!activeOrg) return <p>Select an organization to manage users.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Users</h2>
        {canWrite && <button onClick={openCreate}>New user</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={users}
          rowKey={(u) => u.id}
          columns={[
            { header: 'Name', render: (u) => u.name },
            { header: 'Email', render: (u) => u.email },
            { header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (u) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(u)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit user' : 'New user'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Password {editing && '(leave blank to keep)'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          </div>
          <div className="form-actions">
            <button type="submit">{editing ? 'Save' : 'Create'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
