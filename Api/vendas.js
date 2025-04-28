const { PrismaClient } = require('@prisma/client');
const express = require('express');
const cors = require('cors');

const app = express();
let prisma;

try {
  prisma = new PrismaClient();
  console.log('PrismaClient inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar o PrismaClient:', error);
  process.exit(1); // Encerra o processo para evitar comportamento indefinido
}

// Configurar CORS para permitir requisições do frontend na Netlify
app.use(cors({
  origin: ['https://margemcontribuicao.netlify.app', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Middleware para debug
app.use((req, res, next) => {
  console.log(`Recebida requisição: ${req.method} ${req.url}`);
  next();
});

// Endpoint para salvar uma venda
app.post('/vendas', async (req, res) => {
  console.log('Processando POST /vendas com body:', req.body);
  const { franquia, valor_projeto, margem_valor, margem_percentual } = req.body;
  const data = new Date().toISOString();

  if (!franquia || !valor_projeto || !margem_valor || !margem_percentual) {
    console.log('Erro: Campos obrigatórios ausentes.');
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const newVenda = await prisma.venda.create({
      data: {
        franquia,
        valor_projeto,
        margem_valor,
        margem_percentual,
        data,
      },
    });

    console.log('Venda criada com sucesso:', newVenda);
    res.status(201).json({ id: newVenda.id, message: 'Venda salva com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar venda:', error);
    res.status(500).json({ error: 'Erro ao salvar venda.', details: error.message });
  }
});

// Endpoint para consultar histórico por franquia
app.get('/historico', async (req, res) => {
  console.log('Processando GET /historico');
  try {
    const historico = await prisma.venda.groupBy({
      by: ['franquia'],
      _sum: {
        margem_valor: true,
      },
      _count: {
        _all: true,
      },
    });

    const result = historico.map(item => ({
      franquia: item.franquia,
      total_margem: item._sum.margem_valor,
      total_vendas: item._count._all,
    }));

    console.log('Histórico retornado:', result);
    res.json(result);
  } catch (error) {
    console.error('Erro ao consultar histórico:', error);
    res.status(500).json({ error: 'Erro ao consultar histórico.', details: error.message });
  }
});

// Exportar para Vercel
module.exports = app;