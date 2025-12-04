"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { BookDTO, UserDTO } from "@/types";
import { getLivros, createLivro, getMe } from "@/lib/api";

export default function LivrosPage() {
  const [livros, setLivros] = useState<BookDTO[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titulo: "", autor: "", ano: "", quantidadeTotal: "" });

  useEffect(() => {
    getMe().then(setCurrentUser);
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const data = await getLivros();
      setLivros(data);
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createLivro(formData);
      alert("Livro cadastrado!");
      setShowForm(false);
      setFormData({ titulo: "", autor: "", ano: "", quantidadeTotal: "" });
      carregar();
    } catch (e) {
      alert("Erro ao cadastrar livro.");
    }
  }

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "BIBLIOTECARIO";

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Livros</h2>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
            {showForm ? "Cancelar" : "+ Novo Livro"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-slate-200">
          <h3 className="font-bold mb-4 text-lg">Cadastro de Livro</h3>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input placeholder="Título" className="border p-2 rounded" required
              value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} />
            <input placeholder="Autor" className="border p-2 rounded" required
              value={formData.autor} onChange={e => setFormData({...formData, autor: e.target.value})} />
            <input type="number" placeholder="Ano" className="border p-2 rounded" required
              value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} />
            <input type="number" placeholder="Quantidade Total" className="border p-2 rounded" required
              value={formData.quantidadeTotal} onChange={e => setFormData({...formData, quantidadeTotal: e.target.value})} />
            
            <div className="md:col-span-2">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 w-full md:w-auto">
                Salvar Livro
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && (
        <SimpleTable headers={["Título", "Autor", "Ano", "Total", "Disponíveis"]}>
          {livros.map((livro) => (
            <tr key={livro.id} className="hover:bg-slate-50 border-b border-slate-100">
              <td className="px-4 py-3 font-medium">{livro.titulo}</td>
              <td className="px-4 py-3">{livro.autor}</td>
              <td className="px-4 py-3">{livro.ano ?? "-"}</td>
              <td className="px-4 py-3">{livro.quantidadeTotal}</td>
              <td className="px-4 py-3 font-bold text-blue-800">{livro.quantidadeDisponivel}</td>
            </tr>
          ))}
        </SimpleTable>
      )}
    </AppShell>
  );
}