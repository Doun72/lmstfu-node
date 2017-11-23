# lmstfu-node
A node.js proxy demonstrating virtual patching, lmstfu.com style

See [lmstfu.com](lmstfu.com) for details.

This is a fairly simple node.js application that runs a reverse proxy.

To get this running, the easiest way is to spin up docker:

`docker run --name lmstfu-node -it --rm --net lmstfu lmstfu-node`

You'll need to have an 'lmstfu' network created already in docker:

`docker network create lmstfu`

If you want to spin it up at the same time as lmstfu-modsec, you could
try this simple docker-compose.yml file:


```
version: '3'
services:
  lmstfu-node:
    image: lmstfu-node:latest
    networks: 
     - lmstfu

  lmstfu-modsec:
    image: lmstfu-modsec:latest
    ports:
      - "80:80"
      - "443:443"
    networks: 
     - lmstfu

  redis:
    image: redis
    ports:
      - "6379:6379"
    networks: 
     - lmstfu

networks:
  lmstfu:
    driver: bridge
    ipam:
      driver: default
      config:
       - subnet: 172.28.0.0/16
```
