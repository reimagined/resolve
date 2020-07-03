import maybeThrowError from './maybe-throw-error'
import validateSearchExpression from './validate-search-expression'
import validateTableName from './validate-table-name'
import validateUpdateExpression from './validate-update-expression'
import validateUpdateOptions from './validate-update-options'

const update = async (
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  updateOptions
) => {
  const errors = []
  validateTableName(tableName, errors)
  validateSearchExpression(searchExpression, errors)
  validateUpdateExpression(updateExpression, errors)
  validateUpdateOptions(updateOptions, errors)
  maybeThrowError(readModelName, errors)
}

export default update
