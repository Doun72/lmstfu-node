var redbird = require('redbird');

var changeimage = require('./changeimage');
var autocomplete = require('./autocomplete');
var creditcard = require('./creditcard');
var ordercontrol = require('./ordercontrol');
var stepcontrol = require('./stepcontrol');

var reverseProxy = redbird(
    {
        port:5470
    });

reverseProxy.register("localhost", "http://lmstfu.dev.0-days.net:5000/", {useTargetHostHeader: true});
//reverseProxy.register("localhost", "http://www.dev.0-days.net", {useTargetHostHeader: true});

reverseProxy.proxy.on('proxyReq', changeimage.onRequest());

reverseProxy.proxy.on('proxyReq', ordercontrol.onRequest());
reverseProxy.proxy.on('proxyRes', ordercontrol.onResponse());

reverseProxy.proxy.on('proxyReq', stepcontrol.onRequest());
reverseProxy.proxy.on('proxyRes', stepcontrol.onResponse());

reverseProxy.proxy.on('proxyReq', creditcard.onRequest());
reverseProxy.proxy.on('proxyRes', creditcard.onResponse());

reverseProxy.proxy.on('proxyReq', autocomplete.onRequest());
reverseProxy.proxy.on('proxyRes', autocomplete.onResponse());


// Superceded by modsecurity rules
// Only works for HTTPS site:
//reverseProxy.proxy.on('proxyRes', securecookies.onResponse());

reverseProxy.proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});