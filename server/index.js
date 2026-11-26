
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración para desarrollo local
app.use(cors());
app.use(express.json({ limit: '16mb' }));

// Comprobar que el servidor funciona
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    providerConfigured: Boolean(process.env.FASHN_API_KEY),
  });
});

// Solicitar la generación del avatar
app.post('/api/avatars', async (req, res) => {
  try {
    const apiKey = process.env.FASHN_API_KEY;
    const { imageDataUri } = req.body || {};

    if (!apiKey) {
      return res.status(503).json({
        error: 'Falta configurar la clave de FASHN AI.',
      });
    }

    if (
      typeof imageDataUri !== 'string' ||
      !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageDataUri)
    ) {
      return res.status(400).json({
        error: 'La fotografía no tiene un formato válido.',
      });
    }

    if (imageDataUri.length > 15_000_000) {
      return res.status(413).json({
        error: 'La fotografía es demasiado grande.',
      });
    }

    const response = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_name: 'model-create',
        inputs: {
          prompt:
            'Photorealistic full-body fashion avatar, facing forward, standing in a neutral relaxed pose, both legs visible, wearing a simple fitted white top and black trousers. Clean light studio background. Preserve the recognizable facial identity of the face reference. Natural lighting, realistic anatomy, no text.',
          face_reference: imageDataUri,
          face_reference_mode: 'match_reference',
          aspect_ratio: '2:3',
          resolution: '1k',
          generation_mode: 'fast',
          num_images: 1,
          output_format: 'jpeg',
          return_base64: true,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error('FASHN request failed:', data);

      return res.status(502).json({
        error: data.error?.message || data.message ||
          'No pudimos iniciar la generación del avatar.',
      });
    }

    return res.status(202).json({
      id: data.id,
      message: 'La generación del avatar comenzó.',
    });

  } catch (error) {
    console.error('Avatar generation error:', error);

    return res.status(500).json({
      error: 'Ocurrió un problema al generar el avatar.',
    });
  }
});

// Consultar el progreso de la generación
app.get('/api/avatars/:id', async (req, res) => {
  try {
    const apiKey = process.env.FASHN_API_KEY;
    const { id } = req.params;

    if (!apiKey) {
      return res.status(503).json({
        error: 'Falta configurar la clave de FASHN AI.',
      });
    }

    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
      return res.status(400).json({
        error: 'Identificador inválido.',
      });
    }

    const response = await fetch(
      `https://api.fashn.ai/v1/status/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: 'No pudimos consultar el estado del avatar.',
      });
    }

    return res.json(data);

  } catch (error) {
    console.error('Avatar status error:', error);

    return res.status(500).json({
      error: 'Error consultando el progreso.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`My Fashion Studio server running on port ${PORT}`);
});
