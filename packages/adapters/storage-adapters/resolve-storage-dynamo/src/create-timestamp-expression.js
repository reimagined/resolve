const createTimestampExpression = ({ startTime, finishTime }) => {
  const conditionExpression =
    startTime && finishTime
      ? '(#timestamp BETWEEN :startTime AND :finishTime)'
      : startTime
      ? '(#timestamp > :startTime)'
      : finishTime
      ? '(#timestamp < :finishTime)'
      : ''

  const attributeNames =
    startTime || finishTime
      ? {
          '#timestamp': 'timestamp'
        }
      : {}

  const attributeValues =
    startTime && finishTime
      ? {
          ':startTime': startTime,
          ':finishTime': finishTime
        }
      : startTime
      ? {
          ':startTime': startTime
        }
      : finishTime
      ? {
          ':finishTime': finishTime
        }
      : {}

  return {
    conditionExpression,
    attributeNames,
    attributeValues
  }
}

export default createTimestampExpression
