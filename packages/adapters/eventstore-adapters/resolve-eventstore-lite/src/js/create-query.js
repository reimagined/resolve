const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

const createQuery = (
  pool,
  { eventTypes, aggregateIds, startTime, finishTime }
) => {
  const { escapeId } = pool

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes
        .map(injectString.bind(null, pool))
        .join(', ')})`
    )
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds
        .map(injectString.bind(null, pool))
        .join(', ')})`
    )
  }
  if (startTime != null) {
    queryConditions.push(
      `${escapeId('timestamp')} > ${injectNumber(pool, startTime)}`
    )
  }
  if (finishTime != null) {
    queryConditions.push(
      `${escapeId('timestamp')} < ${injectNumber(pool, finishTime)}`
    )
  }

  return queryConditions.length > 0
    ? `WHERE ${queryConditions.join(' AND ')}`
    : ''
}

export default createQuery
