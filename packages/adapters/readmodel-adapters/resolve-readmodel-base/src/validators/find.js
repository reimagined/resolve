import validateSearchExpression from './validate-search-expression'

const find = async (
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  validateSearchExpression(searchExpression)
}

export default find
