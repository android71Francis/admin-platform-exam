import { ReactNode } from 'react';

interface SlideOverProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const SlideOver = ({ open, title, onClose, children }: SlideOverProps) => {
  if (!open) return null;
  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} />
      <aside className="slideover" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {children}
      </aside>
    </>
  );
};
