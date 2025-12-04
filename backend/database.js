const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'biblioteca.db');
const db = new Database(dbPath);

function inicializarBanco() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'ALUNO'
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            autor TEXT NOT NULL,
            ano INTEGER,
            quantidade_total INTEGER NOT NULL DEFAULT 1,
            quantidade_disponivel INTEGER NOT NULL DEFAULT 1
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            livro_id INTEGER NOT NULL,
            data_emprestimo TEXT NOT NULL,
            data_prevista_devolucao TEXT NOT NULL,
            data_devolucao TEXT,
            multa_calculada REAL,
            multa_paga INTEGER DEFAULT 0,
            FOREIGN KEY (aluno_id) REFERENCES users(id),
            FOREIGN KEY (livro_id) REFERENCES books(id)
        )
    `);

    inserirDadosExemplo();

    console.log('Banco de dados inicializado com sucesso!');
}

function inserirDadosExemplo() {
    const countUsers = db.prepare('SELECT COUNT(*) as total FROM users').get();
    
    if (countUsers.total === 0) {
        console.log('Inserindo dados de exemplo...');

        const insertUser = db.prepare(`
            INSERT INTO users (nome, email, password, role) VALUES (?, ?, ?, ?)
        `);

        insertUser.run('Administrador', 'admin@biblioteca.com', '123456', 'ADMIN');
        insertUser.run('Maria Bibliotecaria', 'maria@biblioteca.com', '123456', 'BIBLIOTECARIO');
        insertUser.run('Joao Silva', 'joao@aluno.com', '123456', 'ALUNO');
        insertUser.run('Ana Santos', 'ana@aluno.com', '123456', 'ALUNO');
        insertUser.run('Pedro Oliveira', 'pedro@aluno.com', '123456', 'ALUNO');

        const insertBook = db.prepare(`
            INSERT INTO books (titulo, autor, ano, quantidade_total, quantidade_disponivel) VALUES (?, ?, ?, ?, ?)
        `);

        insertBook.run('Dom Casmurro', 'Machado de Assis', 1899, 5, 3);
        insertBook.run('O Cortico', 'Aluisio Azevedo', 1890, 3, 2);
        insertBook.run('Grande Sertao: Veredas', 'Guimaraes Rosa', 1956, 2, 1);
        insertBook.run('Memórias Postumas de Bras Cubas', 'Machado de Assis', 1881, 4, 4);
        insertBook.run('Vidas Secas', 'Graciliano Ramos', 1938, 3, 3);
        insertBook.run('A Moreninha', 'Joaquim Manuel de Macedo', 1844, 2, 2);

        const insertLoan = db.prepare(`
            INSERT INTO loans (aluno_id, livro_id, data_emprestimo, data_prevista_devolucao, data_devolucao, multa_calculada, multa_paga)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insertLoan.run(3, 1, '2024-11-01', '2024-11-15', '2024-11-14', null, 0);

        insertLoan.run(3, 2, '2024-11-25', '2024-12-10', null, null, 0);

        insertLoan.run(4, 3, '2024-10-01', '2024-10-15', null, 15.00, 0);

        insertLoan.run(4, 4, '2024-10-20', '2024-11-03', '2024-11-10', 7.00, 1);

        insertLoan.run(5, 1, '2024-11-20', '2024-12-05', null, null, 0);

        console.log('Dados de exemplo inseridos!');
    }
}

module.exports = { db, inicializarBanco };
