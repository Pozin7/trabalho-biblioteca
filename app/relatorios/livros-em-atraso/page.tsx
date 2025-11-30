"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { LoanDTO } from "@/types";
import { getLivrosAtrasados } from "@/lib/api";

export default function LivrosAtrasadosPage() {
  const [lista, setLista] = useState<LoanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await getLivrosAtrasados();
        setLista(data);
      } catch (e: any) {
        setErro("Não foi possível carregar os livros em atraso (API ainda não disponível).");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Livros em Atraso</h2>

      {loading && <p>Carregando...</p>}

      {erro && !loading && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <SimpleTable headers={["Aluno", "Livro", "Previsto", "Devolução", "Dias de atraso", "Multa"]}>
          {lista.map((e) => {
            const prevista = new Date(e.dataPrevistaDevolucao);
            const devolucao = e.dataDevolucao ? new Date(e.dataDevolucao) : new Date();
            const diffDias = Math.max(
              0,
              Math.ceil((devolucao.getTime() - prevista.getTime()) / (1000 * 60 * 60 * 24))
            );

            return (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">{e.aluno.nome}</td>
                <td className="px-4 py-2">{e.livro.titulo}</td>
                <td className="px-4 py-2">{prevista.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">{e.dataDevolucao ? new Date(e.dataDevolucao).toLocaleDateString("pt-BR") : "Não devolvido"}</td>
                <td className="px-4 py-2 text-red-600">{diffDias > 0 ? diffDias : "-"}</td>
                <td className="px-4 py-2">{e.multaCalculada ? `R$ ${e.multaCalculada.toFixed(2)}` : "—"}</td>
              </tr>
            );
          })}

          {lista.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-500">
                Sem registros de atraso.
              </td>
            </tr>
          )}
        </SimpleTable>
      )}
    </AppShell>
  );
}
