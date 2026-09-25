const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

const previousEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    return (req, res, next) => {
      // Redireciona automaticamente requisições /api para o backend Node/Express na porta 3001
      // Isso permite que conexões externas (4G / túnel exp.direct / ngrok) acessem o backend
      // diretamente pela mesma porta/túnel do Metro sem nenhuma configuração manual
      if (req.url && req.url.startsWith('/api')) {
        const proxyReq = http.request(
          {
            hostname: '127.0.0.1',
            port: 3001,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              host: '127.0.0.1:3001',
            },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          }
        );

        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Backend Synple indisponível na porta 3001', details: err.message }));
        });

        req.pipe(proxyReq, { end: true });
        return;
      }

      if (typeof previousEnhanceMiddleware === 'function') {
        return previousEnhanceMiddleware(metroMiddleware, server)(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
