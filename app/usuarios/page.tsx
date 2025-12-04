"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SimpleTable } from "@/components/SimpleTable";
import { UserDTO } from "@/types";
import { getUsuarios, createUsuario, getMe } from "@/lib/api";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserDTO[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "", role: "ALUNO", password: "" });

  useEffect(() => {
    getMe().then(setCurrentUser);
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if(!formData.password) return alert("Senha é obrigatória");
    try {
      await createUsuario(formData);
      alert("Usuário criado com sucesso!");
      setShowForm(false);
      setFormData({ nome: "", email: "", role: "ALUNO", password: "" });
      carregar();
    } catch (e) {
      alert("Erro ao criar usuário. Verifique se o email já existe.");
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usuários</h2>
        {currentUser?.role === "ADMIN" && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "+ Novo Usuário"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-slate-200">
          <h3 className="font-bold mb-4 text-lg">Cadastro de Usuário</h3>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input 
              placeholder="Nome completo" 
              className="border p-2 rounded" 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})} 
              required 
            />
            <input 
              placeholder="Email" 
              type="email" 
              className="border p-2 rounded" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <input 
              placeholder="Senha" 
              type="password" 
              className="border p-2 rounded" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
            <select 
              className="border p-2 rounded" 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            >
              <option value="ALUNO">Aluno</option>
              <option value="BIBLIOTECARIO">Bibliotecário</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <div className="md:col-span-2">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 w-full md:w-auto">
                Salvar Usuário
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && (
        <SimpleTable headers={["Nome", "Email", "Papel"]}>
          {usuarios.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50 border-b border-slate-100">
              <td className="px-4 py-3">{u.nome}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-800">
                  {u.role}
                </span>
              </td>
            </tr>
          ))}
        </SimpleTable>
      )}
    </AppShell>
  );
}