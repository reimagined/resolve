import validateSearchExpression from './validate-search-expression'

const count = async (
  readModelName,
  tableName,
  searchExpression
) => {
  validateSearchExpression(searchExpression)
}

export default count
