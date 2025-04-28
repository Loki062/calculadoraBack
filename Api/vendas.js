const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

// Configurar CORS para permitir requisições do frontend na Netlify
app.use(cors({
  origin: ['https://margemcontribuicao.netlify.app', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Conectar ao banco de dados PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Necessário para Neon
});

pool.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
  } else {
    console.log('Conectado ao banco PostgreSQL (Neon).');
  }
});

// Endpoint para salvar uma venda
app.post('/vendas', async (req, res) => {
  const { franquia, valor_projeto, margem_valor, margem_percentual } = req.body;
  const data = new Date().toISOString();

  if (!franquia || !valor_projeto || !margem_valor || !margem_percentual) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO vendas (franquia, valor_projeto, margem_valor, margem_percentual, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [franquia, valor_projeto, margem_valor, margem_percentual, data]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Venda salva com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar venda.' });
  }
});

// Endpoint para consultar histórico por franquia
app.get('/historico', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT franquia, 
             SUM(margem_valor) as total_margem,
             COUNT(*) as total_vendas
      FROM vendas
      GROUP BY franquia
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar histórico.' });
  }
});

// Exportar para Vercel
module.exports = app;