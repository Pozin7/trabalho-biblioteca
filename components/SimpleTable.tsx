// components/SimpleTable.tsx
import { ReactNode } from "react";

interface SimpleTableProps {
  headers: string[];
  children: ReactNode;
}

export function SimpleTable({ headers, children }: SimpleTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
