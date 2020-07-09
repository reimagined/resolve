import validateSearchExpression from './validate-search-expression'
import maybeThrowError from './maybe-throw-error'

const findOne = async (
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const errors = []
  validateSearchExpression(searchExpression, errors)
  maybeThrowError(errors)
}

export default findOne
