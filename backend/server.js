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

inicializarBanco();

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('Backend Biblioteca iniciado!');
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('Usuarios de teste:');
    console.log('  - admin@biblioteca.com / 123456 (ADMIN)');
    console.log('  - maria@biblioteca.com / 123456 (BIBLIOTECARIO)');
    console.log('  - joao@aluno.com / 123456 (ALUNO)');
    console.log('');
    console.log('Rotas disponiveis:');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/auth/logout');
    console.log('  GET  /api/me');
    console.log('  GET  /api/books');
    console.log('  GET  /api/users');
    console.log('  GET  /api/loans');
    console.log('  GET  /api/relatorios/livros-por-aluno');
    console.log('  GET  /api/relatorios/livros-atrasados');
    console.log('='.repeat(50));
});
