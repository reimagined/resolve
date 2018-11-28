import createAggregateIdExpression from '../src/create-aggregate-id-expression'

describe('method "createAggregateIdExpression"', () => {
  test('should return empty expression', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createAggregateIdExpression({ aggregateIds: undefined })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('Regression test. [null] should return empty expression', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createAggregateIdExpression({ aggregateIds: null })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for single aggregateId', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createAggregateIdExpression({ aggregateIds: ['id1'] })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for many aggregatesIds', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createAggregateIdExpression({ aggregateIds: ['id1', 'id2'] })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })
})
