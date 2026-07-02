const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('MP_ACCESS_TOKEN não configurado nas variáveis de ambiente.');
    return res.status(500).json({ error: 'Pagamento indisponível no momento. Tente novamente mais tarde.' });
  }

  const { nome, valor } = req.body || {};

  if (typeof nome !== 'string' || !nome.trim()) {
    return res.status(400).json({ error: 'Nome do presente é obrigatório.' });
  }

  const preco = Number(valor);
  if (!Number.isFinite(preco) || preco <= 0) {
    return res.status(400).json({ error: 'Valor do presente é inválido.' });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const baseUrl = `https://${req.headers.host}`;

    const result = await preference.create({
      body: {
        items: [
          {
            title: nome.trim().slice(0, 256),
            quantity: 1,
            currency_id: 'BRL',
            unit_price: preco,
          },
        ],
        back_urls: {
          success: `${baseUrl}/?pagamento=sucesso`,
          failure: `${baseUrl}/?pagamento=erro`,
          pending: `${baseUrl}/?pagamento=pendente`,
        },
        auto_return: 'approved',
      },
    });

    return res.status(200).json({ init_point: result.init_point });
  } catch (err) {
    console.error('Erro ao criar preferência no Mercado Pago:', err);
    return res.status(500).json({ error: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.' });
  }
};
