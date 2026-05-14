import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TeamDTO } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

export const TeamsPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TeamDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', activeOrg?.id],
    queryFn: async () => (await api.get<TeamDTO[]>(`/orgs/${activeOrg!.id}/teams`)).data,
    enabled: !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post(`/orgs/${activeOrg!.id}/teams`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setCreating(false); setName(''); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/orgs/${activeOrg!.id}/teams/${id}`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setEditing(null); setName(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orgs/${activeOrg!.id}/teams/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const openCreate = () => { setCreating(true); setName(''); };
  const openEdit = (t: TeamDTO) => { setEditing(t); setName(t.name); };
  const close = () => { setCreating(false); setEditing(null); setName(''); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, name });
    else createMutation.mutate(name);
  };

  if (!activeOrg) return <p>Select an organization to manage teams.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Teams</h2>
        {canWrite && <button onClick={openCreate}>New team</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={teams}
          rowKey={(t) => t.id}
          columns={[
            { header: 'Name', render: (t) => t.name },
            { header: 'Created', render: (t) => new Date(t.createdAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (t) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(t)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete ${t.name}?`)) deleteMutation.mutate(t.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit team' : 'New team'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
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
