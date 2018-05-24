const getLastTimestamp = async ({ metaInfo }) => metaInfo.timestamp;

const setLastTimestamp = async ({ metaInfo }, timestamp) =>
  (metaInfo.timestamp = +timestamp);

const tableExists = async ({ metaInfo }, tableName) =>
  !!metaInfo.tables[tableName];

const getTableInfo = async ({ metaInfo }, tableName) =>
  metaInfo.tables[tableName];

const describeTable = async ({ metaInfo }, tableName, metaSchema) =>
  (metaInfo.tables[tableName] = metaSchema);

const getTableNames = async ({ metaInfo }) => Object.keys(metaInfo.tables);

const clearObjects = (...objs) =>
  objs.forEach(obj =>
    Object.keys(obj).forEach(key => Reflect.deleteProperty(obj, key))
  );

const drop = async ({ storage, metaInfo }) => clearObjects(storage, metaInfo);

export default {
  getLastTimestamp,
  setLastTimestamp,
  tableExists,
  getTableInfo,
  describeTable,
  getTableNames,
  drop
};
