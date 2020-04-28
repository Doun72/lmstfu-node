import redbird from 'redbird';

// var changeimage = require('./changeimage');
// var autocomplete = require('./autocomplete');
// var creditcard = require('./creditcard');
// var ordercontrol = require('./ordercontrol');
// var stepcontrol = require('./stepcontrol');

import * as changetohash from './changetohash.js';

var bodyChange = function(proxyReq, bodyOrigin) {
  bodyOrigin.modify = true;
  //if you change content-type => proxyReq.setHeader('content-type', 'application/xml');
  delete bodyOrigin.xxx;
};

var reverseProxy = redbird(
    {
        port:5470,
        body: {
          change: bodyChange,
          parserName: 'urlencoded'
        }
    });

//reverseProxy.register("localhost", "http://lmstfu.dev.0-days.net:5000/", {useTargetHostHeader: true});
reverseProxy.register("lmstfu-node:5470", "web:4000", {ssl:false, useTargetHostHeader: true});

//reverseProxy.proxy.on('proxyReq', changeimage.onRequest());
reverseProxy.proxy.on('proxyReq', changetohash.onRequest());

//reverseProxy.proxy.on('proxyReq', ordercontrol.onRequest());
//reverseProxy.proxy.on('proxyRes', ordercontrol.onResponse());
//
//reverseProxy.proxy.on('proxyReq', stepcontrol.onRequest());
//reverseProxy.proxy.on('proxyRes', stepcontrol.onResponse());
//
//reverseProxy.proxy.on('proxyReq', creditcard.onRequest());
//reverseProxy.proxy.on('proxyRes', creditcard.onResponse());
//
//reverseProxy.proxy.on('proxyReq', autocomplete.onRequest());
//reverseProxy.proxy.on('proxyRes', autocomplete.onResponse());

reverseProxy.proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});
