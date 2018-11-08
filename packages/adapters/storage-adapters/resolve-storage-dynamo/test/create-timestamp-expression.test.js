import createTimestampExpression from '../src/create-timestamp-expression'

describe('method "createTimestampExpression"', () => {
  test('should return empty expression', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTimestampExpression({
      startTime: undefined,
      finishTime: undefined
    })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for startTime', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTimestampExpression({ startTime: 5, finishTime: undefined })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for finishTime', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTimestampExpression({ startTime: undefined, finishTime: 10 })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for startTime and finishTime', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTimestampExpression({ startTime: 5, finishTime: 10 })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })
})
