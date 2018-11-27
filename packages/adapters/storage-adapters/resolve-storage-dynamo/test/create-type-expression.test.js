import createTypeExpression from '../src/create-type-expression'
import createAggregateIdExpression from '../src/create-aggregate-id-expression'

describe('method "createAggregateIdExpression"', () => {
  test('should return empty expression', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTypeExpression({ eventTypes: undefined })

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
    } = createTypeExpression({ eventTypes: null })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for single eventType', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTypeExpression({ eventTypes: ['type1'] })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })

  test('should return correctly expression for many eventTypes', () => {
    const {
      conditionExpression,
      attributeNames,
      attributeValues
    } = createTypeExpression({ eventTypes: ['type1', 'type2'] })

    expect({
      conditionExpression,
      attributeNames,
      attributeValues
    }).toMatchSnapshot()
  })
})
