const createTypeExpression = ({ eventTypes = [] }) => {
  const conditionExpression =
    eventTypes == null || eventTypes.length === 0
      ? ''
      : eventTypes.length === 1
      ? `(#type = :eventType0)`
      : `(#type IN (${eventTypes.map(
          (eventType, eventTypeIndex) => `:eventType${eventTypeIndex}`
        )}))`

  const attributeNames =
    eventTypes != null && eventTypes.length > 0
      ? {
          '#type': 'type'
        }
      : {}

  const attributeValues =
    eventTypes != null &&
    eventTypes.reduce((obj, eventType, index) => {
      obj[`:eventType${index}`] = eventType
      return obj
    }, {})

  return {
    conditionExpression,
    attributeNames,
    attributeValues
  }
}

export default createTypeExpression
