"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { LoanDTO, UserDTO } from "@/types";
import { getLivrosPorAluno, getUsuarios } from "@/lib/api";

export default function RelatorioPorAlunoPage() {
  const [alunos, setAlunos] = useState<UserDTO[]>([]);
  const [alunoId, setAlunoId] = useState<string>("");
  const [emprestimos, setEmprestimos] = useState<LoanDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // pegar lista de usuários para filtrar alunos
    getUsuarios()
      .then((users) => setAlunos(users.filter((u) => u.role === "ALUNO")))
      .catch(() => {
        /* ignore - backend não pronto */
      });
  }, []);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await getLivrosPorAluno(alunoId || undefined);
        setEmprestimos(data);
      } catch (e: any) {
        setErro("Não foi possível carregar o relatório (API ainda não disponível).");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [alunoId]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Relatório — Livros por Aluno</h2>

        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={alunoId}
          onChange={(e) => setAlunoId(e.target.value)}
        >
          <option value="">(Todos / aluno logado)</option>
          {alunos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Carregando relatório...</p>}

      {erro && !loading && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <SimpleTable headers={["Aluno", "Livro", "Empréstimo", "Previsto", "Devolução", "Multa"]}>
          {emprestimos.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-2">{e.aluno.nome}</td>
              <td className="px-4 py-2">{e.livro.titulo}</td>
              <td className="px-4 py-2">{new Date(e.dataEmprestimo).toLocaleDateString("pt-BR")}</td>
              <td className="px-4 py-2">{new Date(e.dataPrevistaDevolucao).toLocaleDateString("pt-BR")}</td>
              <td className="px-4 py-2">{e.dataDevolucao ? new Date(e.dataDevolucao).toLocaleDateString("pt-BR") : "—"}</td>
              <td className="px-4 py-2">{e.multaCalculada ? `R$ ${e.multaCalculada.toFixed(2)}` : "—"}</td>
            </tr>
          ))}

          {emprestimos.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-500">
                Nenhum empréstimo encontrado para o filtro selecionado.
              </td>
            </tr>
          )}
        </SimpleTable>
      )}
    </AppShell>
  );
}
