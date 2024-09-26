const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const multer = require('multer');
const { uploadToCDN } = require('./cdnUploader');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4.5 * 1024 * 1024 }
});

const app = express();

const nggUrl = 'https://cybriagames.netlify.app';

const proxy = createProxyMiddleware({
  target: nggUrl,
  changeOrigin: true,
  secure: true,
  logLevel: 'debug',
  router: function(req) {
    if (req.headers.host === 'cybriagames.netlify.app') {
      req.headers['X-Forwarded-For'] = ''; 
      req.headers['X-Real-IP'] = '';
      req.headers['Via'] = '';
    }
    return nggUrl;
  }
});

app.use(async (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentlength = req.headers['content-length'] || 0;

    if (contentlength > 4.5 * 1024 * 1024) {
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(413).send('Data too large');
        }

        try {
          const cdnres = await uploadToCDN(req.file);
          const tempurl = cdnres.url;

          return res.json({ tempurl });
        } catch (uploadError) {
          return res.status(500).send('Err');
        }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

app.use('/', proxy);

const port = process.env.PORT || 443;
app.listen(port, () => {
  console.log(`Portable CyGames is running on port ${port}`);
});
