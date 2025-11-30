"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { UserDTO } from "@/types";
import { getUsuarios } from "@/lib/api";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await getUsuarios();
        setUsuarios(data);
      } catch (e: any) {
        setErro(
          "Não foi possível carregar os usuários (API ainda não disponível)."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  function getRoleLabel(role: UserDTO["role"]) {
    if (role === "ADMIN") return "Admin";
    if (role === "BIBLIOTECARIO") return "Bibliotecário";
    return "Aluno";
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Usuários</h2>
        {/* Depois você pode colocar aqui um botão "Novo usuário" para o admin */}
      </div>

      {loading && <p>Carregando usuários...</p>}

      {erro && !loading && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <SimpleTable headers={["Nome", "Email", "Papel"]}>
          {usuarios.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="px-4 py-2">{u.nome}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {getRoleLabel(u.role)}
                </span>
              </td>
            </tr>
          ))}

          {usuarios.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-4 text-center text-sm text-slate-500"
              >
                Nenhum usuário encontrado.
              </td>
            </tr>
          )}
        </SimpleTable>
      )}
    </AppShell>
  );
}
