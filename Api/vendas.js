const { PrismaClient } = require('@prisma/client');
const express = require('express');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

// Configurar CORS para permitir requisições do frontend na Netlify
app.use(cors({
  origin: ['https://margemcontribuicao.netlify.app', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Endpoint para salvar uma venda
app.post('/vendas', async (req, res) => {
  const { franquia, valor_projeto, margem_valor, margem_percentual } = req.body;
  const data = new Date().toISOString();

  if (!franquia || !valor_projeto || !margem_valor || !margem_percentual) {
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

    res.status(201).json({ id: newVenda.id, message: 'Venda salva com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar venda:', error);
    res.status(500).json({ error: 'Erro ao salvar venda.' });
  }
});

// Endpoint para consultar histórico por franquia
app.get('/historico', async (req, res) => {
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

    res.json(result);
  } catch (error) {
    console.error('Erro ao consultar histórico:', error);
    res.status(500).json({ error: 'Erro ao consultar histórico.' });
  }
});

// Exportar para Vercel
module.exports = app;