const { spawn } = require('child_process');
const path = require('path');

const clientPath = path.join(__dirname, './client');
const serverPath = path.join(__dirname, './server');

const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

spawn(npmCmd, ['start'], {
    env: process.env,
    cwd: serverPath,
    stdio: 'inherit'
});

spawn(npmCmd, ['start'], {
    env: process.env,
    cwd: clientPath,
    stdio: 'inherit'
});
