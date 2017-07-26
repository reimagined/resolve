import http from 'http';
import socketIO from 'socket.io';
import app from './express';

import connectionHandler from './socket';
import config from '../configs/server.config.js';

const server = http.createServer(app);
const io = socketIO(server, {
    path: `${config.rootDirectory || ''}/socket`
});
let currentApp = app;

io.on('connection', connectionHandler);
server.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log('> Ready on http://localhost:3000!!');
});

server.listen(3000);

if (module.hot) {
    module.hot.accept('./express', () => {
        server.removeListener('request', currentApp);
        server.on('request', app);
        currentApp = app;
    });
}
