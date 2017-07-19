import { fork } from 'child_process';
import path from 'path';

process.env.NODE_ENV = 'production';

const forkConfig = {
    env: { NODE_ENV: 'production' },
    cwd: process.cwd(),
    stdio: 'inherit'
};

fork(path.join(process.cwd(), './dist/server/server.js'), [], forkConfig);
