const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

// Configurar CORS para permitir requisições do frontend na Netlify
app.use(cors({
  origin: ['https://margemcontribuicao.netlify.app', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Conectar ao banco de dados SQLite (em memória)
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
  } else {
    console.log('Conectado ao banco SQLite em memória.');
  }
});

// Criar tabela de vendas
db.run(`
  CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    franquia TEXT NOT NULL,
    valor_projeto REAL NOT NULL,
    margem_valor REAL NOT NULL,
    margem_percentual REAL NOT NULL,
    data TEXT NOT NULL
  )
`);

// Endpoint para salvar uma venda
app.post('/vendas', (req, res) => {
  const { franquia, valor_projeto, margem_valor, margem_percentual } = req.body;
  const data = new Date().toISOString();

  if (!franquia || !valor_projeto || !margem_valor || !margem_percentual) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const stmt = db.prepare(`
    INSERT INTO vendas (franquia, valor_projeto, margem_valor, margem_percentual, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(franquia, valor_projeto, margem_valor, margem_percentual, data, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao salvar venda.' });
    }
    res.status(201).json({ id: this.lastID, message: 'Venda salva com sucesso!' });
  });
  stmt.finalize();
});

// Endpoint para consultar histórico por franquia
app.get('/historico', (req, res) => {
  db.all(`
    SELECT franquia, 
           SUM(margem_valor) as total_margem,
           COUNT(*) as total_vendas
    FROM vendas
    GROUP BY franquia
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao consultar histórico.' });
    }
    res.json(rows);
  });
});

// Exportar para Vercel
module.exports = app;