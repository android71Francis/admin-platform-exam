import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { OrganizationDTO } from '@admin-platform-exam/types';
import { api, setActiveOrgId } from '../lib/axios';
import { useAuth } from './AuthContext';

interface OrgContextValue {
  orgs: OrganizationDTO[];
  activeOrg: OrganizationDTO | null;
  setActiveOrg: (org: OrganizationDTO) => void;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);
const STORAGE_KEY = 'exam.activeOrgId';

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrganizationDTO[]>([]);
  const [activeOrg, setActiveOrgState] = useState<OrganizationDTO | null>(null);

  const refresh = async () => {
    if (!user) {
      setOrgs([]);
      setActiveOrgState(null);
      setActiveOrgId(null);
      return;
    }
    const res = await api.get<OrganizationDTO[]>('/orgs');
    setOrgs(res.data);
    const stored = localStorage.getItem(STORAGE_KEY);
    const next = res.data.find((o) => o.id === stored) ?? res.data[0] ?? null;
    setActiveOrgState(next);
    setActiveOrgId(next?.id ?? null);
  };

  useEffect(() => { refresh(); }, [user]);

  const setActiveOrg = (org: OrganizationDTO) => {
    setActiveOrgState(org);
    setActiveOrgId(org.id);
    localStorage.setItem(STORAGE_KEY, org.id);
  };

  return (
    <OrgContext.Provider value={{ orgs, activeOrg, setActiveOrg, refresh }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider');
  return ctx;
};
