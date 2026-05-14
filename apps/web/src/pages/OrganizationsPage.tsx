import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrganizationDTO } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

export const OrganizationsPage = () => {
  const queryClient = useQueryClient();
  const { refresh } = useOrg();
  const { canWrite } = usePermission();
  const [editing, setEditing] = useState<OrganizationDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => (await api.get<OrganizationDTO[]>('/orgs')).data,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<OrganizationDTO>('/orgs', { name }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      refresh();
      setCreating(false);
      setName('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch(`/orgs/${id}`, { name }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      refresh();
      setEditing(null);
      setName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orgs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      refresh();
    },
  });

  const openCreate = () => { setCreating(true); setName(''); };
  const openEdit = (org: OrganizationDTO) => { setEditing(org); setName(org.name); };
  const close = () => { setCreating(false); setEditing(null); setName(''); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, name });
    else createMutation.mutate(name);
  };

  return (
    <>
      <div className="page-header">
        <h2>Organizations</h2>
        {canWrite && <button onClick={openCreate}>New organization</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={orgs}
          rowKey={(o) => o.id}
          columns={[
            { header: 'Name', render: (o) => o.name },
            { header: 'Created', render: (o) => new Date(o.createdAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (o) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(o)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete ${o.name}?`)) deleteMutation.mutate(o.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit organization' : 'New organization'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save' : 'Create'}
            </button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
