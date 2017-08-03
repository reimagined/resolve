import { fork } from 'child_process';
import path from 'path';

const forkConfig = {
    env: { NODE_ENV: 'production', ...process.env },
    cwd: process.cwd(),
    stdio: 'inherit'
};

fork(path.join(process.cwd(), './dist/server/server.js'), [], forkConfig);
