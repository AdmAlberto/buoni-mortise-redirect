module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Metodo non consentito.'
    });
  }

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  const apiKey = process.env.APPS_SCRIPT_API_KEY;

  if (!appsScriptUrl || !apiKey) {
    console.error('Configurazione Vercel incompleta.');

    return res.status(500).json({
      success: false,
      error: 'Configurazione server incompleta.'
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

    const action = String(body.action || '').trim();
    const params = body.params || {};

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Azione mancante.'
      });
    }

    const allowedActions = new Set([
      'getPublicBootstrap',
      'createPublicOrder',

      'createSumUpCheckout',
      'verifySumUpPayment',
      'completePaidSumUpOrder',

      'createSatispayPayment',
      'verifySatispayPayment',
      'completePaidSatispayOrder'
    ]);

    if (!allowedActions.has(action)) {
      return res.status(403).json({
        success: false,
        error: 'Azione non autorizzata.'
      });
    }

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      redirect: 'follow',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        apiKey: apiKey,
        action: action,
        params: params
      })
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    }
    catch (error) {
      console.error('Risposta Apps Script non JSON:', text);

      return res.status(502).json({
        success: false,
        error: 'Risposta non valida dal backend.'
      });
    }

    return res.status(200).json(data);
  }
  catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error:
        error && error.message
          ? error.message
          : 'Errore interno del server.'
    });
  }
};
