"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { LoanDTO } from "@/types";
import { getEmprestimos } from "@/lib/api";

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<LoanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await getEmprestimos();
        setEmprestimos(data);
      } catch (e: any) {
        setErro(
          "Não foi possível carregar os empréstimos (API ainda não disponível)."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Empréstimos</h2>

      {loading && <p>Carregando empréstimos...</p>}

      {erro && !loading && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <SimpleTable
          headers={[
            "Aluno",
            "Livro",
            "Empréstimo",
            "Previsto",
            "Devolução",
            "Multa",
          ]}
        >
          {emprestimos.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-2">{e.aluno.nome}</td>
              <td className="px-4 py-2">{e.livro.titulo}</td>
              <td className="px-4 py-2">
                {new Date(e.dataEmprestimo).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-2">
                {new Date(e.dataPrevistaDevolucao).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-2">
                {e.dataDevolucao
                  ? new Date(e.dataDevolucao).toLocaleDateString("pt-BR")
                  : "—"}
              </td>
              <td className="px-4 py-2">
                {e.multaCalculada
                  ? `R$ ${e.multaCalculada.toFixed(2)}`
                  : "—"}
              </td>
            </tr>
          ))}

          {emprestimos.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-4 text-center text-sm text-slate-500"
              >
                Nenhum empréstimo encontrado.
              </td>
            </tr>
          )}
        </SimpleTable>
      )}
    </AppShell>
  );
}
