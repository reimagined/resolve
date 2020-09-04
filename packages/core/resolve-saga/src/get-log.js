import getLog from 'resolve-debug-levels';

export default (scope) => getLog(`resolve:resolve-saga:${scope}`);
