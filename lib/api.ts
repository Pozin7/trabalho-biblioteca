// lib/api.ts
// Atualizado para consumir backend externo em localhost:3001

import { BookDTO, LoanDTO, UserDTO } from "@/types";

// URL do backend - altere conforme necessario
const API_URL = "http://localhost:3001";

// Token de autenticacao
let authToken: string | null = null;

// Gerenciamento do token
function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }
}

function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("authToken");
  }
  return authToken;
}

// Headers com autenticacao
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Erro na requisicao");
  }
  return res.json() as Promise<T>;
}

// Usuario logado
export async function getMe(): Promise<UserDTO | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/me`, {
      cache: "no-store",
      headers: getHeaders(),
    });
    if (res.status === 401) {
      setAuthToken(null);
      return null;
    }
    return handleResponse<UserDTO>(res);
  } catch (error) {
    console.error("Erro ao buscar usuario:", error);
    return null;
  }
}

// Auth
export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Email ou senha invalidos");
  }

  const result = await res.json();

  // Salva o token
  if (result.token) {
    setAuthToken(result.token);
  }

  return { success: true };
}

export async function logout() {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: getHeaders(),
    });
  } catch (error) {
    console.error("Erro no logout:", error);
  }
  setAuthToken(null);
}

// Livros
export async function getLivros(): Promise<BookDTO[]> {
  const res = await fetch(`${API_URL}/api/books`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  return handleResponse<BookDTO[]>(res);
}

// Emprestimos
export async function getEmprestimos(): Promise<LoanDTO[]> {
  const res = await fetch(`${API_URL}/api/loans`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  return handleResponse<LoanDTO[]>(res);
}

// Usuarios
export async function getUsuarios(): Promise<UserDTO[]> {
  const res = await fetch(`${API_URL}/api/users`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  return handleResponse<UserDTO[]>(res);
}

// Relatorios
export async function getLivrosPorAluno(alunoId?: string): Promise<LoanDTO[]> {
  const url = alunoId
    ? `${API_URL}/api/relatorios/livros-por-aluno?alunoId=${alunoId}`
    : `${API_URL}/api/relatorios/livros-por-aluno`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  return handleResponse<LoanDTO[]>(res);
}

export async function getLivrosAtrasados(): Promise<LoanDTO[]> {
  const res = await fetch(`${API_URL}/api/relatorios/livros-atrasados`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  return handleResponse<LoanDTO[]>(res);
}