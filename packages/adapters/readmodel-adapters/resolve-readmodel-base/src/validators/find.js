import validateSearchExpression from './validate-search-expression'
import maybeThrowError from './maybe-throw-error'

const find = async (
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const errors = []
  validateSearchExpression(searchExpression, errors)
  maybeThrowError(errors)
}

export default find
