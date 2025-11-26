// components/AppShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api";
import { UserDTO } from "@/types";

interface Props {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/livros", label: "Livros" },
  { href: "/emprestimos", label: "Empréstimos" },
  { href: "/usuarios", label: "Usuários", roles: ["ADMIN", "BIBLIOTECARIO"] },
  {
    href: "/relatorios/livros-por-aluno",
    label: "Relatório por Aluno",
    roles: ["ADMIN", "BIBLIOTECARIO", "ALUNO"],
  },
  {
    href: "/relatorios/livros-em-atraso",
    label: "Livros em Atraso",
    roles: ["ADMIN", "BIBLIOTECARIO"],
  },
];

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-100">
        <div className="border-b border-slate-700 p-4">
          <h1 className="text-xl font-semibold">Biblioteca</h1>
          <p className="text-xs text-slate-300">
            {user.nome} ({user.role})
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems
            .filter(
              (item) =>
                !item.roles || item.roles.includes(user.role as any)
            )
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-slate-700 font-medium"
                      : "hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <button
          onClick={handleLogout}
          className="m-2 rounded-md bg-red-500 py-2 text-sm font-medium hover:bg-red-600"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 bg-slate-100">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
