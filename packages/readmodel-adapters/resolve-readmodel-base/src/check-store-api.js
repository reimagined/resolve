import messages from './messages';

const checkCondition = (condition, messageGenerator, ...args) => {
  if (!condition) {
    throw new Error(
      typeof messageGenerator === 'function'
        ? messageGenerator(...args)
        : messageGenerator
    );
  }
};

const checkOptionShape = (option, types) => {
  return !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  );
};

const checkAndGetTableMetaSchema = (tableName, tableSchema) => {
  checkCondition(
    Array.isArray(tableSchema),
    messages.invalidTableSchema,
    tableName,
    messages.tableDescriptorNotArray,
    tableSchema
  );

  const validTypes = ['number', 'string', 'json'];
  const indexRoles = ['primary', 'secondary'];
  let primaryIndex = null;
  const secondaryIndexes = [];
  const fieldTypes = {};

  for (let columnDescription of tableSchema) {
    checkCondition(
      checkOptionShape(columnDescription, [Object]),
      messages.invalidTableSchema,
      tableName,
      messages.columnDescriptorInvalidShape,
      columnDescription
    );
    const { name, type, index } = columnDescription;
    checkCondition(
      /^(?:\w|\d|-)+?$/.test(name),
      messages.invalidTableSchema,
      tableName,
      messages.columnWrongName,
      columnDescription
    );
    checkCondition(
      validTypes.indexOf(type) > -1 &&
        (!index || indexRoles.indexOf(index) > -1),
      messages.invalidTableSchema,
      tableName,
      messages.columnWrongTypeOrIndex,
      columnDescription
    );

    if (index) {
      checkCondition(
        type === 'number' || type === 'string',
        messages.invalidTableSchema,
        tableName,
        messages.wrongTypeForIndexedColumn,
        columnDescription
      );
      if (index === 'primary') {
        primaryIndex = { name, type };
      } else {
        secondaryIndexes.push({ name, type });
      }
    }

    fieldTypes[name] = type;
  }

  checkCondition(
    checkOptionShape(primaryIndex, [Object]),
    messages.invalidTableSchema,
    tableName,
    messages.tableWithoutPrimaryIndex,
    tableSchema
  );

  return { primaryIndex, secondaryIndexes, fieldTypes };
};

const checkAndGetFieldType = (metaInfo, fieldName) => {
  if (!/^(?:\w|\d|-)+?(?:\.(?:\w|\d|-)+?)*?$/.test(fieldName)) return null;

  const [baseName, ...nestedName] = fieldName.split('.');
  if (!metaInfo.fieldTypes[baseName]) return null;

  const fieldType = metaInfo.fieldTypes[baseName];
  if (nestedName.length > 0 && fieldType !== 'json') {
    return null;
  }

  return fieldType;
};

const checkFieldList = (metaInfo, fieldList, validProjectionValues = []) => {
  if (!checkOptionShape(fieldList, [Object, Array])) {
    return '*';
  }

  if (Array.isArray(fieldList)) {
    for (let fieldName of fieldList) {
      if (!checkAndGetFieldType(metaInfo, fieldName)) {
        return fieldName;
      }
    }
    return;
  }

  for (let fieldName of Object.keys(fieldList)) {
    if (
      !checkAndGetFieldType(metaInfo, fieldName) ||
      !(validProjectionValues.indexOf(fieldList[fieldName]) > -1)
    ) {
      return fieldName;
    }
  }

  return null;
};

const isFieldValueCorrect = (
  metaInfo,
  fieldName,
  fieldValue,
  isNullable = true
) => {
  try {
    const fieldType = checkAndGetFieldType(metaInfo, fieldName);
    if (!fieldType) return false;
    if (fieldType === 'json') return true;
    if (fieldValue == null) return isNullable;

    return (
      (fieldType === 'number' && fieldValue.constructor === Number) ||
      (fieldType === 'string' && fieldValue.constructor === String)
    );
  } catch (err) {
    return false;
  }
};

const checkInsertedDocumentShape = (tableName, metaInfo, document) => {
  const documentKeys = document instanceof Object ? Object.keys(document) : [];

  checkCondition(
    checkOptionShape(document, [Object]) &&
      Object.keys(metaInfo.fieldTypes).length === documentKeys.length,
    messages.invalidFieldList,
    'insert',
    tableName,
    document,
    messages.fieldListNotObject
  );

  const checkFieldResult = checkFieldList(metaInfo, documentKeys);
  checkCondition(
    checkFieldResult == null,
    messages.invalidFieldList,
    'insert',
    tableName,
    document,
    messages.unexistingField,
    checkFieldResult
  );

  const { primaryIndex, secondaryIndexes } = metaInfo;

  for (let fieldName of documentKeys) {
    const isNullable = !(
      primaryIndex.name === fieldName ||
      secondaryIndexes.find(({ name }) => name === fieldName)
    );

    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, document[fieldName], isNullable),
      messages.invalidFieldList,
      'insert',
      document,
      messages.columnTypeMismatch,
      fieldName
    );
  }
};

const checkSearchExpression = (
  tableName,
  operation,
  metaInfo,
  searchExpression
) => {
  checkCondition(
    checkOptionShape(searchExpression, [Object]),
    messages.invalidSearchExpression,
    operation,
    tableName,
    searchExpression,
    messages.searchExpressionNotObject
  );

  const allowedComparationOperators = [
    '$lt',
    '$lte',
    '$gt',
    '$gte',
    '$eq',
    '$ne'
  ];
  const allowedLogicalOperators = ['$and', '$or', '$not'];

  const operators = Object.keys(searchExpression).filter(
    key => key.indexOf('$') > -1
  );

  checkCondition(
    operators.length === 0 ||
      operators.length === Object.keys(searchExpression).length,
    messages.invalidSearchExpression,
    operation,
    tableName,
    searchExpression,
    messages.mixedSearchOperatorsAndValues
  );

  if (operators.length > 0) {
    for (let operator of operators) {
      checkCondition(
        allowedLogicalOperators.includes(operator),
        messages.invalidSearchExpression,
        operation,
        tableName,
        searchExpression,
        messages.illegalLogicalOperator,
        operator
      );

      if (operator === '$not') {
        checkSearchExpression(
          tableName,
          operation,
          metaInfo,
          searchExpression[operator]
        );
        return;
      }

      checkCondition(
        Array.isArray(searchExpression[operator]),
        messages.invalidSearchExpression,
        operation,
        tableName,
        searchExpression,
        messages.illegalOperatorAndOrArgument,
        searchExpression[operator]
      );

      for (let nestedExpr of searchExpression[operator]) {
        checkSearchExpression(tableName, operation, metaInfo, nestedExpr);
      }
    }

    return;
  }

  const documentKeys = Object.keys(searchExpression);

  const checkFieldResult = checkFieldList(metaInfo, documentKeys);
  checkCondition(
    checkFieldResult == null,
    messages.invalidFieldList,
    operation,
    tableName,
    searchExpression,
    messages.unexistingField,
    checkFieldResult
  );

  const { primaryIndex, secondaryIndexes } = metaInfo;

  for (let fieldName of documentKeys) {
    const isNullable = !(
      primaryIndex.name === fieldName ||
      secondaryIndexes.find(({ name }) => name === fieldName)
    );

    let fieldValue = searchExpression[fieldName];

    if (searchExpression[fieldName] instanceof Object) {
      const inOperators = Object.keys(searchExpression[fieldName]).filter(
        key => key.indexOf('$') > -1
      );

      checkCondition(
        inOperators.length === 0 || inOperators.length === 1,
        messages.invalidSearchExpression,
        operation,
        tableName,
        searchExpression,
        messages.searchValueScalarOrCompareOperator,
        searchExpression[fieldName]
      );

      if (inOperators.length > 0) {
        checkCondition(
          allowedComparationOperators.indexOf(inOperators[0]) > -1,
          messages.invalidSearchExpression,
          operation,
          tableName,
          searchExpression,
          messages.illegalCompareOperator,
          searchExpression[fieldName]
        );

        fieldValue = searchExpression[fieldName][inOperators[0]];
      }
    }

    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, fieldValue, isNullable),
      messages.invalidSearchExpression,
      operation,
      tableName,
      searchExpression,
      messages.incompatibleSearchField,
      { [fieldName]: fieldValue }
    );
  }
};

const checkUpdateExpression = (tableName, metaInfo, updateExpression) => {
  const operators =
    updateExpression instanceof Object
      ? Object.keys(updateExpression).filter(key => key.indexOf('$') > -1)
      : [];

  checkCondition(
    checkOptionShape(updateExpression, [Object]) &&
      (operators.length > 0 &&
        operators.length === Object.keys(updateExpression).length),
    messages.invalidUpdateExpression,
    tableName,
    updateExpression,
    messages.updateExpressionNotValidObject
  );

  const allowedOperators = ['$set', '$unset', '$inc'];

  for (let operator of operators) {
    checkCondition(
      allowedOperators.includes(operator),
      messages.invalidUpdateExpression,
      tableName,
      updateExpression,
      messages.illegalUpdateOperator,
      operator
    );

    const affectedFields = updateExpression[operator];
    checkCondition(
      checkOptionShape(affectedFields, [Object]),
      messages.invalidUpdateExpression,
      tableName,
      updateExpression,
      messages.updateOperatorNotObject,
      affectedFields
    );

    for (let fieldName of Object.keys(affectedFields)) {
      const fieldType = checkAndGetFieldType(metaInfo, fieldName);
      if (
        operator === '$unset' ||
        (fieldType === 'json' && operator === '$set')
      )
        continue;

      const updateValueType =
        affectedFields[fieldName] == null
          ? 'null'
          : affectedFields[fieldName].constructor === Number
            ? 'number'
            : affectedFields[fieldName].constructor === String
              ? 'string'
              : 'null';

      checkCondition(
        (operator === '$set' && updateValueType === fieldType) ||
          (operator === '$inc' && updateValueType === 'number'),
        messages.invalidUpdateExpression,
        tableName,
        updateExpression,
        messages.uncompatibleUpdateValue,
        fieldName
      );
    }
  }
};

const checkTableExists = async (metaApi, tableName) => {
  checkCondition(
    await metaApi.tableExists(tableName),
    messages.tableNotExist,
    tableName
  );
};

const defineTable = async (
  { metaApi, storeApi },
  tableName,
  inputTableSchema
) => {
  checkCondition(
    !(await metaApi.tableExists(tableName)),
    messages.tableExists,
    tableName
  );
  const tableSchema = checkAndGetTableMetaSchema(tableName, inputTableSchema);
  await storeApi.defineTable(tableName, tableSchema);
  await metaApi.describeTable(tableName, tableSchema);
};

const find = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  resultFieldsList,
  sortFieldsList,
  skip = 0,
  limit = Infinity
) => {
  await checkTableExists(metaApi, tableName);
  const metaInfo = await metaApi.getTableInfo(tableName);

  if (resultFieldsList != null) {
    const checkFieldResult = checkFieldList(metaInfo, resultFieldsList, [0, 1]);

    checkCondition(
      checkFieldResult == null,
      messages.invalidFieldList,
      'find',
      tableName,
      resultFieldsList,
      ...(checkFieldResult !== '*'
        ? [messages.illegalProjectionColumn, checkFieldResult]
        : [messages.projectionNotObject])
    );
  }

  if (sortFieldsList != null) {
    const checkFieldResult = checkFieldList(metaInfo, sortFieldsList, [-1, 1]);

    checkCondition(
      checkFieldResult == null,
      messages.invalidFieldList,
      'find',
      tableName,
      resultFieldsList,
      ...(checkFieldResult !== '*'
        ? [messages.illegalSortColumn, checkFieldResult]
        : [messages.sortNotObject])
    );
  }

  checkSearchExpression(tableName, 'find', metaInfo, searchExpression);

  checkCondition(
    ((Number.isInteger(limit) && limit > -1) || limit === Infinity) &&
      Number.isInteger(skip) &&
      skip > -1,
    messages.invalidPagination,
    skip,
    limit
  );

  return await storeApi.find(
    tableName,
    searchExpression,
    resultFieldsList,
    sortFieldsList,
    skip,
    limit
  );
};

const findOne = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  resultFieldsList
) => {
  await checkTableExists(metaApi, tableName);

  const metaInfo = await metaApi.getTableInfo(tableName);
  if (resultFieldsList != null) {
    const checkFieldResult = checkFieldList(metaInfo, resultFieldsList, [0, 1]);

    checkCondition(
      checkFieldResult == null,
      messages.invalidFieldList,
      'findOne',
      tableName,
      resultFieldsList,
      ...(checkFieldResult !== '*'
        ? [messages.illegalProjectionColumn, checkFieldResult]
        : [messages.projectionNotObject])
    );
  }

  checkSearchExpression(tableName, 'findOne', metaInfo, searchExpression);

  return await storeApi.findOne(tableName, searchExpression, resultFieldsList);
};

const count = async ({ metaApi, storeApi }, tableName, searchExpression) => {
  await checkTableExists(metaApi, tableName);

  const metaInfo = await metaApi.getTableInfo(tableName);
  checkSearchExpression(tableName, 'count', metaInfo, searchExpression);

  return await storeApi.count(tableName, searchExpression);
};

const insert = async ({ metaApi, storeApi }, tableName, document) => {
  await checkTableExists(metaApi, tableName);

  const metaInfo = await metaApi.getTableInfo(tableName);
  checkInsertedDocumentShape(tableName, metaInfo, document);

  await storeApi.insert(tableName, document);
};

const update = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  updateExpression
) => {
  await checkTableExists(metaApi, tableName);

  const metaInfo = await metaApi.getTableInfo(tableName);
  checkSearchExpression(tableName, 'update', metaInfo, searchExpression);
  checkUpdateExpression(tableName, metaInfo, updateExpression);

  await storeApi.update(tableName, searchExpression, updateExpression);
};

const del = async ({ metaApi, storeApi }, tableName, searchExpression) => {
  await checkTableExists(metaApi, tableName);

  const metaInfo = await metaApi.getTableInfo(tableName);
  checkSearchExpression(tableName, 'delete', metaInfo, searchExpression);

  await storeApi.del(tableName, searchExpression);
};

const checkStoreApi = pool => {
  return Object.freeze({
    defineTable: defineTable.bind(null, pool),
    find: find.bind(null, pool),
    findOne: findOne.bind(null, pool),
    count: count.bind(null, pool),
    insert: insert.bind(null, pool),
    update: update.bind(null, pool),
    delete: del.bind(null, pool)
  });
};

export default checkStoreApi;
