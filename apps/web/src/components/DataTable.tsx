import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  empty?: string;
  rowKey: (row: T) => string;
}

export function DataTable<T>({ rows, columns, empty = 'No items', rowKey }: DataTableProps<T>) {
  if (rows.length === 0) return <div className="empty-state">{empty}</div>;

  return (
    <table>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} style={c.width ? { width: c.width } : undefined}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((c, i) => <td key={i}>{c.render(row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
