const implementation = (metaApi, storeApi, createTable, options) => {
  const pool = {
    metaInfo: { tables: {}, timestamp: 0 },
    createTable,
    storage: {}
  };

  if (options.storage && options.storage.constructor === Object) {
    pool.storage = options.storage;
  }

  if (options.metaInfo && options.metaInfo.constructor === Object) {
    pool.metaInfo = options.metaInfo;
  }

  return {
    metaApi: Object.keys(metaApi).reduce((acc, key) => {
      acc[key] = metaApi[key].bind(null, pool);
      return acc;
    }, {}),

    storeApi: Object.keys(storeApi).reduce((acc, key) => {
      acc[key] = storeApi[key].bind(null, pool);
      return acc;
    }, {})
  };
};

export default implementation;
