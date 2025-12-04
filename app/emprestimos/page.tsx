"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { LoanDTO, UserDTO, BookDTO } from "@/types";
import { getEmprestimos, createEmprestimo, devolverLivro, getMe, getUsuarios, getLivros } from "@/lib/api";

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<LoanDTO[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [usersList, setUsersList] = useState<UserDTO[]>([]);
  const [booksList, setBooksList] = useState<BookDTO[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBook, setSelectedBook] = useState("");

  useEffect(() => {
    getMe().then(setCurrentUser);
    carregar();
  }, []);

  useEffect(() => {
    if (showForm) {
      Promise.all([getUsuarios(), getLivros()]).then(([u, b]) => {
        setUsersList(u.filter(user => user.role === 'ALUNO'));
        setBooksList(b.filter(book => book.quantidadeDisponivel > 0));
      });
    }
  }, [showForm]);

  async function carregar() {
    setLoading(true);
    try {
      const data = await getEmprestimos();
      setEmprestimos(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }

  async function handleNovo(e: React.FormEvent) {
    e.preventDefault();
    if(!selectedUser || !selectedBook) return alert("Selecione aluno e livro");
    
    try {
      await createEmprestimo({ userId: selectedUser, bookId: selectedBook });
      alert("Empréstimo realizado com sucesso!");
      setShowForm(false);
      setSelectedUser("");
      setSelectedBook("");
      carregar();
    } catch (e) {
      alert("Erro ao realizar empréstimo (verifique estoque).");
    }
  }

  async function handleDevolver(id: string) {
    if(!confirm("Confirmar a devolução deste livro?")) return;
    try {
      const res = await devolverLivro(id);
      //@ts-ignore
      if(res.multa > 0) alert(`Devolvido com atraso! Multa: R$ ${res.multa.toFixed(2)}`);
      else alert("Devolvido com sucesso!");
      carregar();
    } catch (e) {
      alert("Erro na devolução.");
    }
  }

  const canManage = currentUser?.role === "ADMIN" || currentUser?.role === "BIBLIOTECARIO";

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Empréstimos</h2>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
            {showForm ? "Cancelar" : "+ Novo Empréstimo"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-slate-200">
          <h3 className="font-bold mb-4 text-lg">Registrar Empréstimo</h3>
          <form onSubmit={handleNovo} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-1 font-bold">Aluno</label>
              <select className="border p-2 rounded w-full" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                <option value="">Selecione o aluno...</option>
                {usersList.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold">Livro Disponível</label>
              <select className="border p-2 rounded w-full" value={selectedBook} onChange={e => setSelectedBook(e.target.value)} required>
                <option value="">Selecione o livro...</option>
                {booksList.map(b => <option key={b.id} value={b.id}>{b.titulo} (Restam: {b.quantidadeDisponivel})</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 w-full md:w-auto">
                Confirmar Empréstimo
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && (
        <SimpleTable
          headers={["Aluno", "Livro", "Empréstimo", "Previsto", "Devolução", "Multa", "Ações"]}
        >
          {emprestimos.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50 border-b border-slate-100">
              <td className="px-4 py-3">{e.aluno.nome}</td>
              <td className="px-4 py-3">{e.livro.titulo}</td>
              <td className="px-4 py-3">
                {new Date(e.dataEmprestimo).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3">
                {new Date(e.dataPrevistaDevolucao).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3 font-bold">
                {e.dataDevolucao
                  ? new Date(e.dataDevolucao).toLocaleDateString("pt-BR")
                  : <span className="text-orange-600">Pendente</span>}
              </td>
              <td className="px-4 py-3 text-red-600 font-bold">
                {e.multaCalculada
                  ? `R$ ${e.multaCalculada.toFixed(2)}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                {canManage && !e.dataDevolucao && (
                  <button 
                    onClick={() => handleDevolver(e.id)}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-purple-700"
                  >
                    Devolver
                  </button>
                )}
              </td>
            </tr>
          ))}
        </SimpleTable>
      )}
    </AppShell>
  );
}