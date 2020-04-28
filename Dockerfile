FROM node:14.0-alpine
# ENV NODE_ENV production
# WORKDIR /usr/src/app
# COPY ["package.json", "npm-shrinkwrap.json*", "./"]
# RUN npm install --production && mv node_modules ../
# COPY . .
# EXPOSE 5470
# CMD node index.js

ENV NODE_ENV production
WORKDIR /code

COPY . /code
RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python
RUN npm install -g --quiet node-gyp 
RUN npm install -g nodemon

COPY package.json /code/package.json
RUN npm install && npm ls
# RUN mv /code/node_modules /node_module
# CMD ["npm", "start"]
CMD node --experimental-modules index.js