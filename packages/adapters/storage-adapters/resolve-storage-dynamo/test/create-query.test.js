import createQuery from '../src/create-query'
import createAggregateIdExpression from '../src/create-aggregate-id-expression'
import createTypeExpression from '../src/create-type-expression'
import createTimestampExpression from '../src/create-timestamp-expression'
import expressionObject from '../src/expression-object'
import expressionString from '../src/expression-string'

describe('method "createQuery"', () => {
  test('should return correctly query', () => {
    const tableName = 'tableName'

    for (const { aggregateIds, eventTypes, startTime, finishTime } of [
      {
        aggregateIds: undefined,
        eventTypes: undefined,
        startTime: undefined,
        finishTime: undefined
      },
      {
        aggregateIds: null,
        eventTypes: null,
        startTime: undefined,
        finishTime: undefined
      },
      {
        aggregateIds: ['id1'],
        eventTypes: undefined,
        startTime: 5,
        finishTime: undefined
      },
      {
        aggregateIds: ['id1', 'id2'],
        eventTypes: undefined,
        startTime: undefined,
        finishTime: 10
      },
      {
        aggregateIds: ['id1'],
        eventTypes: ['type1'],
        startTime: 5,
        finishTime: 10
      },
      {
        aggregateIds: ['id1', 'id2'],
        eventTypes: ['type1'],
        startTime: undefined,
        finishTime: 10
      },
      {
        aggregateIds: ['id1'],
        eventTypes: ['type1', 'type2'],
        startTime: 5,
        finishTime: undefined
      },
      {
        aggregateIds: ['id1', 'id2'],
        eventTypes: ['type1', 'type2'],
        startTime: undefined,
        finishTime: undefined
      }
    ]) {
      const filter = { aggregateIds, eventTypes, startTime, finishTime }

      const {
        conditionExpression: typeConditionExpression,
        attributeNames: typeAttributeNames,
        attributeValues: typeAttributeValues
      } = createTypeExpression(filter)

      const {
        conditionExpression: timestampConditionExpression,
        attributeNames: timestampAttributeNames,
        attributeValues: timestampAttributeValues
      } = createTimestampExpression(filter)

      const {
        conditionExpression: aggregateIdConditionExpression,
        attributeNames: aggregateIdAttributeNames,
        attributeValues: aggregateIdAttributeValues
      } = createAggregateIdExpression(filter)

      const query = createQuery(
        { tableName, expressionString, expressionObject },
        { aggregateIds },
        {
          aggregateIdAttributeNames,
          aggregateIdAttributeValues,
          aggregateIdConditionExpression,
          typeAttributeNames,
          typeAttributeValues,
          typeConditionExpression,
          timestampAttributeNames,
          timestampAttributeValues,
          timestampConditionExpression
        }
      )

      expect(query).toMatchSnapshot(JSON.stringify(filter))
    }
  })
})
