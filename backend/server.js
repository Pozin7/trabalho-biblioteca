// Arquivo: back-biblioteca/server.js

const express = require('express');
const cors = require('cors');
const { db, inicializarBanco } = require('./database');

const app = express();
const PORT = 3001;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

const sessions = new Map();

function gerarToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function autenticar(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Nao autorizado' });
    }
    
    req.usuario = sessions.get(token);
    next();
}

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
        }

        const usuario = db.prepare(`
            SELECT id, nome, email, role FROM users WHERE email = ? AND password = ?
        `).get(email, password);

        if (!usuario) {
            return res.status(401).json({ error: 'Email ou senha invalidos' });
        }

        const token = gerarToken();
        sessions.set(token, {
            id: String(usuario.id),
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role
        });

        res.json({ 
            success: true, 
            token: token,
            user: {
                id: String(usuario.id),
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        sessions.delete(token);
    }
    
    res.json({ success: true });
});

app.get('/api/me', autenticar, (req, res) => {
    res.json(req.usuario);
});

app.get('/api/books', autenticar, (req, res) => {
    try {
        const livros = db.prepare(`
            SELECT 
                id,
                titulo,
                autor,
                ano,
                quantidade_total as quantidadeTotal,
                quantidade_disponivel as quantidadeDisponivel
            FROM books
            ORDER BY titulo
        `).all();

        const resultado = livros.map(livro => ({
            ...livro,
            id: String(livro.id)
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/users', autenticar, (req, res) => {
    try {
        const usuarios = db.prepare(`
            SELECT id, nome, email, role FROM users ORDER BY nome
        `).all();

        const resultado = usuarios.map(user => ({
            ...user,
            id: String(user.id)
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar usuarios:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


app.get('/api/loans', autenticar, (req, res) => {
    try {
        const emprestimos = db.prepare(`
            SELECT 
                l.id,
                l.data_emprestimo,
                l.data_prevista_devolucao,
                l.data_devolucao,
                l.multa_calculada,
                l.multa_paga,
                u.id as aluno_id,
                u.nome as aluno_nome,
                u.email as aluno_email,
                u.role as aluno_role,
                b.id as livro_id,
                b.titulo as livro_titulo,
                b.autor as livro_autor,
                b.ano as livro_ano,
                b.quantidade_total as livro_qtd_total,
                b.quantidade_disponivel as livro_qtd_disponivel
            FROM loans l
            INNER JOIN users u ON l.aluno_id = u.id
            INNER JOIN books b ON l.livro_id = b.id
            ORDER BY l.data_emprestimo DESC
        `).all();

        const resultado = emprestimos.map(emp => ({
            id: String(emp.id),
            dataEmprestimo: emp.data_emprestimo,
            dataPrevistaDevolucao: emp.data_prevista_devolucao,
            dataDevolucao: emp.data_devolucao || null,
            multaCalculada: emp.multa_calculada || null,
            multaPaga: emp.multa_paga === 1,
            aluno: {
                id: String(emp.aluno_id),
                nome: emp.aluno_nome,
                email: emp.aluno_email,
                role: emp.aluno_role
            },
            livro: {
                id: String(emp.livro_id),
                titulo: emp.livro_titulo,
                autor: emp.livro_autor,
                ano: emp.livro_ano,
                quantidadeTotal: emp.livro_qtd_total,
                quantidadeDisponivel: emp.livro_qtd_disponivel
            }
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar emprestimos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/relatorios/livros-por-aluno', autenticar, (req, res) => {
    try {
        const { alunoId } = req.query;

        let sql = `
            SELECT 
                l.id,
                l.data_emprestimo,
                l.data_prevista_devolucao,
                l.data_devolucao,
                l.multa_calculada,
                l.multa_paga,
                u.id as aluno_id,
                u.nome as aluno_nome,
                u.email as aluno_email,
                u.role as aluno_role,
                b.id as livro_id,
                b.titulo as livro_titulo,
                b.autor as livro_autor,
                b.ano as livro_ano,
                b.quantidade_total as livro_qtd_total,
                b.quantidade_disponivel as livro_qtd_disponivel
            FROM loans l
            INNER JOIN users u ON l.aluno_id = u.id
            INNER JOIN books b ON l.livro_id = b.id
        `;

        let emprestimos;
        
        if (alunoId) {
            sql += ' WHERE l.aluno_id = ? ORDER BY l.data_emprestimo DESC';
            emprestimos = db.prepare(sql).all(alunoId);
        } else {
            sql += ' ORDER BY u.nome, l.data_emprestimo DESC';
            emprestimos = db.prepare(sql).all();
        }

        const resultado = emprestimos.map(emp => ({
            id: String(emp.id),
            dataEmprestimo: emp.data_emprestimo,
            dataPrevistaDevolucao: emp.data_prevista_devolucao,
            dataDevolucao: emp.data_devolucao || null,
            multaCalculada: emp.multa_calculada || null,
            multaPaga: emp.multa_paga === 1,
            aluno: {
                id: String(emp.aluno_id),
                nome: emp.aluno_nome,
                email: emp.aluno_email,
                role: emp.aluno_role
            },
            livro: {
                id: String(emp.livro_id),
                titulo: emp.livro_titulo,
                autor: emp.livro_autor,
                ano: emp.livro_ano,
                quantidadeTotal: emp.livro_qtd_total,
                quantidadeDisponivel: emp.livro_qtd_disponivel
            }
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar relatorio:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/relatorios/livros-atrasados', autenticar, (req, res) => {
    try {

        const hoje = new Date().toISOString().split('T')[0];

        const emprestimos = db.prepare(`
            SELECT 
                l.id,
                l.data_emprestimo,
                l.data_prevista_devolucao,
                l.data_devolucao,
                l.multa_calculada,
                l.multa_paga,
                u.id as aluno_id,
                u.nome as aluno_nome,
                u.email as aluno_email,
                u.role as aluno_role,
                b.id as livro_id,
                b.titulo as livro_titulo,
                b.autor as livro_autor,
                b.ano as livro_ano,
                b.quantidade_total as livro_qtd_total,
                b.quantidade_disponivel as livro_qtd_disponivel
            FROM loans l
            INNER JOIN users u ON l.aluno_id = u.id
            INNER JOIN books b ON l.livro_id = b.id
            WHERE l.data_devolucao IS NULL 
              AND l.data_prevista_devolucao < ?
            ORDER BY l.data_prevista_devolucao ASC
        `).all(hoje);

        const resultado = emprestimos.map(emp => ({
            id: String(emp.id),
            dataEmprestimo: emp.data_emprestimo,
            dataPrevistaDevolucao: emp.data_prevista_devolucao,
            dataDevolucao: emp.data_devolucao || null,
            multaCalculada: emp.multa_calculada || null,
            multaPaga: emp.multa_paga === 1,
            aluno: {
                id: String(emp.aluno_id),
                nome: emp.aluno_nome,
                email: emp.aluno_email,
                role: emp.aluno_role
            },
            livro: {
                id: String(emp.livro_id),
                titulo: emp.livro_titulo,
                autor: emp.livro_autor,
                ano: emp.livro_ano,
                quantidadeTotal: emp.livro_qtd_total,
                quantidadeDisponivel: emp.livro_qtd_disponivel
            }
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar livros atrasados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// --- NOVAS ROTAS (ADICIONADAS AQUI) ---

// 1. Criar Usuário
app.post('/api/users', autenticar, (req, res) => {
    try {
        if (req.usuario.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { nome, email, password, role } = req.body;
        if (!nome || !email || !password) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }
        const stmt = db.prepare(`INSERT INTO users (nome, email, password, role) VALUES (?, ?, ?, ?)`);
        const info = stmt.run(nome, email, password, role || 'ALUNO');
        res.json({ id: String(info.lastInsertRowid), nome, email, role });
    } catch (error) {
        console.error('Erro ao criar usuario:', error);
        res.status(500).json({ error: 'Erro ao criar usuario (email ja existe?)' });
    }
});

// 2. Criar Livro
app.post('/api/books', autenticar, (req, res) => {
    try {
        if (req.usuario.role === 'ALUNO') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { titulo, autor, ano, quantidadeTotal } = req.body;
        const qtd = Number(quantidadeTotal) || 1;
        const stmt = db.prepare(`INSERT INTO books (titulo, autor, ano, quantidade_total, quantidade_disponivel) VALUES (?, ?, ?, ?, ?)`);
        const info = stmt.run(titulo, autor, ano, qtd, qtd);
        res.json({ id: String(info.lastInsertRowid), titulo });
    } catch (error) {
        console.error('Erro ao criar livro:', error);
        res.status(500).json({ error: 'Erro ao criar livro' });
    }
});

// 3. Realizar Empréstimo
app.post('/api/loans', autenticar, (req, res) => {
    try {
        if (req.usuario.role === 'ALUNO') {
            return res.status(403).json({ error: 'Apenas funcionarios podem registrar emprestimos' });
        }
        const { userId, bookId } = req.body;
        const livro = db.prepare('SELECT quantidade_disponivel FROM books WHERE id = ?').get(bookId);
        
        if (!livro || livro.quantidade_disponivel <= 0) {
            return res.status(400).json({ error: 'Livro indisponivel' });
        }

        const hoje = new Date();
        const dataEmprestimo = hoje.toISOString().split('T')[0];
        const dataPrevistaObj = new Date();
        dataPrevistaObj.setDate(hoje.getDate() + 7); // 7 dias de prazo
        const dataPrevista = dataPrevistaObj.toISOString().split('T')[0];

        const transaction = db.transaction(() => {
            const stmtLoan = db.prepare(`INSERT INTO loans (aluno_id, livro_id, data_emprestimo, data_prevista_devolucao, multa_paga) VALUES (?, ?, ?, ?, 0)`);
            const info = stmtLoan.run(userId, bookId, dataEmprestimo, dataPrevista);
            const stmtUpdateBook = db.prepare(`UPDATE books SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?`);
            stmtUpdateBook.run(bookId);
            return info;
        });

        const info = transaction();
        res.json({ id: String(info.lastInsertRowid), success: true });
    } catch (error) {
        console.error('Erro no emprestimo:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// 4. Devolver Livro
app.put('/api/loans/:id/devolver', autenticar, (req, res) => {
    try {
        if (req.usuario.role === 'ALUNO') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const loanId = req.params.id;
        const hoje = new Date();
        const dataDevolucao = hoje.toISOString().split('T')[0];

        const emprestimo = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
        if (!emprestimo) return res.status(404).json({ error: 'Emprestimo nao encontrado' });
        if (emprestimo.data_devolucao) return res.status(400).json({ error: 'Ja devolvido' });

        let multa = 0;
        const prevista = new Date(emprestimo.data_prevista_devolucao);
        const diffTime = hoje - prevista;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
            multa = diffDays * 2.0; // R$ 2,00 por dia
        }

        const transaction = db.transaction(() => {
            db.prepare(`UPDATE loans SET data_devolucao = ?, multa_calculada = ? WHERE id = ?`).run(dataDevolucao, multa, loanId);
            db.prepare(`UPDATE books SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?`).run(emprestimo.livro_id);
        });

        transaction();
        res.json({ success: true, multa });
    } catch (error) {
        console.error('Erro na devolucao:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

inicializarBanco();

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('Backend Biblioteca iniciado!');
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log('='.repeat(50));
});