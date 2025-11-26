// lib/api.ts
import { BookDTO, LoanDTO, UserDTO } from "@/types";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Erro na requisição");
  }
  return res.json() as Promise<T>;
}

// Usuário logado
export async function getMe(): Promise<UserDTO | null> {
  const res = await fetch("/api/me", { cache: "no-store" });
  if (res.status === 401) return null;
  return handleResponse<UserDTO>(res);
}

// Auth
export async function login(data: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

// Livros
export async function getLivros(): Promise<BookDTO[]> {
  const res = await fetch("/api/books", { cache: "no-store" });
  return handleResponse<BookDTO[]>(res);
}

// Empréstimos
export async function getEmprestimos(): Promise<LoanDTO[]> {
  const res = await fetch("/api/loans", { cache: "no-store" });
  return handleResponse<LoanDTO[]>(res);
}

// Usuários
export async function getUsuarios(): Promise<UserDTO[]> {
  const res = await fetch("/api/users", { cache: "no-store" });
  return handleResponse<UserDTO[]>(res);
}

// Relatórios
export async function getLivrosPorAluno(
  alunoId?: string
): Promise<LoanDTO[]> {
  const url = alunoId
    ? `/api/relatorios/livros-por-aluno?alunoId=${alunoId}`
    : `/api/relatorios/livros-por-aluno`;
  const res = await fetch(url, { cache: "no-store" });
  return handleResponse<LoanDTO[]>(res);
}

export async function getLivrosAtrasados(): Promise<LoanDTO[]> {
  const res = await fetch("/api/relatorios/livros-atrasados", {
    cache: "no-store",
  });
  return handleResponse<LoanDTO[]>(res);
}
