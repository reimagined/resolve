import validateSearchExpression from './validate-search-expression'

const findOne = async (
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  validateSearchExpression(searchExpression)
}

export default findOne
