import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContentDTO, UserDTO, ContentStatus } from '@admin-platform-exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

interface ContentFormState {
  title: string;
  body: string;
  status: ContentStatus;
  assignedToId: string;
}

const empty: ContentFormState = { title: '', body: '', status: 'DRAFT', assignedToId: '' };

export const ContentPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ContentDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ContentFormState>(empty);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: async () => (await api.get<ContentDTO[]>('/content')).data,
    enabled: !!activeOrg,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-content'],
    queryFn: async () => (await api.get<UserDTO[]>('/users')).data,
    enabled: !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: (data: ContentFormState) => api.post('/content', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContentFormState> }) =>
      api.patch(`/content/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content'] }),
  });

  const openCreate = () => { setCreating(true); setForm({ ...empty, assignedToId: users[0]?.id ?? '' }); };
  const openEdit = (c: ContentDTO) => {
    setEditing(c);
    setForm({ title: c.title, body: c.body, status: c.status, assignedToId: c.assignedToId });
  };
  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  if (!activeOrg) return <p>Select an organization to manage content.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Content</h2>
        {canWrite && <button onClick={openCreate} disabled={users.length === 0}>New content</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={items}
          rowKey={(c) => c.id}
          columns={[
            { header: 'Title', render: (c) => c.title },
            { header: 'Status', render: (c) => <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span> },
            { header: 'Assigned to', render: (c) => c.assignedTo?.name ?? c.assignedToId },
            { header: 'Updated', render: (c) => new Date(c.updatedAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (c) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(c)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete "${c.title}"?`)) deleteMutation.mutate(c.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit content' : 'New content'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Body</label>
            <textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>
          <div className="form-field">
            <label>Assigned to</label>
            <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} required>
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
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
