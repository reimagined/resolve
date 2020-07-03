import validateSearchExpression from './validate-search-expression'

const del = async (
  readModelName,
  tableName,
  searchExpression
) => {
  validateSearchExpression(searchExpression)
}

export default del
