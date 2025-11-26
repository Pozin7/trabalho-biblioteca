"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { BookDTO } from "@/types";
import { getLivros } from "@/lib/api";

export default function LivrosPage() {
  const [livros, setLivros] = useState<BookDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await getLivros();
        setLivros(data);
      } catch (e: any) {
        setErro("Não foi possível carregar os livros (API ainda não disponível).");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Livros</h2>
      </div>

      {loading && <p>Carregando livros...</p>}

      {erro && !loading && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <SimpleTable headers={["Título", "Autor", "Ano", "Total", "Disponíveis"]}>
          {livros.map((livro) => (
            <tr key={livro.id} className="hover:bg-slate-50">
              <td className="px-4 py-2">{livro.titulo}</td>
              <td className="px-4 py-2">{livro.autor}</td>
              <td className="px-4 py-2">{livro.ano ?? "-"}</td>
              <td className="px-4 py-2">{livro.quantidadeTotal}</td>
              <td className="px-4 py-2">{livro.quantidadeDisponivel}</td>
            </tr>
          ))}

          {livros.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-4 text-center text-sm text-slate-500"
              >
                Nenhum livro cadastrado ainda.
              </td>
            </tr>
          )}
        </SimpleTable>
      )}
    </AppShell>
  );
}
