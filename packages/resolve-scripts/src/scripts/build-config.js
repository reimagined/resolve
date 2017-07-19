import path from 'path';

const configPath = path.join(process.cwd(), './resolve.build.config.js');

const result = {
    extendWebpack: () => {}
};

try {
    const config = require(configPath);
    if(typeof(config.extendWebpack) === 'function') {
        result.extendWebpack = config.extendWebpack;
    }
} catch (err) { }

export default result;
