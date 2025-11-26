// app/page.tsx
import { AppShell } from "@/components/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>
      <p className="mb-6 text-sm text-slate-600">
        Bem-vindo ao sistema da biblioteca. Use o menu ao lado para navegar.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total de livros</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Empréstimos em aberto</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Livros em atraso</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>
    </AppShell>
  );
}
