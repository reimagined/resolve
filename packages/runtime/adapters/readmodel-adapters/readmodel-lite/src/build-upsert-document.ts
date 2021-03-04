import type { BuildUpsertDocumentMethod, JsonMap } from './types'

const buildUpsertDocument: BuildUpsertDocumentMethod = (
  searchExpression,
  updateExpression
) => {
  const searchPart = !(
    '$and' in searchExpression ||
    '$or' in searchExpression ||
    '$not' in searchExpression
  )
    ? searchExpression
    : {}
  const updatePart = '$set' in updateExpression ? updateExpression['$set'] : {}

  const baseDocument = { ...searchPart, ...updatePart }

  const resultDocument: ReturnType<BuildUpsertDocumentMethod> = {}

  for (const key of Object.keys(baseDocument)) {
    const nestedKeys = key.split('.')
    let currentResultDocument = resultDocument
    for (const [idx, innerKey] of nestedKeys.entries()) {
      if (!currentResultDocument.hasOwnProperty(innerKey)) {
        currentResultDocument[innerKey] = isNaN(Number(nestedKeys[idx + 1]))
          ? nestedKeys.length - 1 === idx
            ? baseDocument[key]
            : {}
          : []
        currentResultDocument = currentResultDocument[innerKey] as JsonMap
      }
    }
  }

  return resultDocument
}

export default buildUpsertDocument
