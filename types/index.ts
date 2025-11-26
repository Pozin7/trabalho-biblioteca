// types/index.ts

export type UserRole = "ADMIN" | "BIBLIOTECARIO" | "ALUNO";

export interface UserDTO {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

export interface BookDTO {
  id: string;
  titulo: string;
  autor: string;
  ano?: number;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
}

export interface LoanDTO {
  id: string;
  aluno: UserDTO;
  livro: BookDTO;
  dataEmprestimo: string;          // ISO string
  dataPrevistaDevolucao: string;   // ISO string
  dataDevolucao?: string | null;   // ISO string | null
  multaCalculada?: number | null;
  multaPaga?: boolean;
}
