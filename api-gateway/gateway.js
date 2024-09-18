// api-gateway.js
const express = require('express');
const httpProxy = require('http-proxy');
const jwt = require('jsonwebtoken');

const app = express();
const proxy = httpProxy.createProxyServer();

app.use((req, res, next) => {
  if (req.path.startsWith('/auth')) return next();

  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token.split(' ')[1], 'secret-key');
    req.user = verified;
    console.log('User info available in gateway', req.user);

    // Add the user information to the headers
    req.headers['x-user-data'] = JSON.stringify(req.user);
    
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
});

app.all('/auth/*', (req, res) => {
  proxy.web(req, res, { target: 'http://localhost:3001' });
});

app.all('/profile/*', (req, res) => {
  proxy.web(req, res, { target: 'http://localhost:3002' });
});

app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});
