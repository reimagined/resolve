import sinon from 'sinon'

import loadEvents from '../src/load-events'

describe('method "loadEvents"', () => {
  test('should return pagination query', async () => {
    const aggregateIdAttributeNames = 'aggregateIdAttributeNames'
    const aggregateIdAttributeValues = 'aggregateIdAttributeValues'
    const aggregateIdConditionExpression = 'aggregateIdConditionExpression'
    const typeAttributeNames = 'typeAttributeNames'
    const typeAttributeValues = 'typeAttributeValues'
    const typeConditionExpression = 'typeConditionExpression'
    const timestampAttributeNames = 'timestampAttributeNames'
    const timestampAttributeValues = 'timestampAttributeValues'
    const timestampConditionExpression = 'timestampConditionExpression'

    const query = { name: 'query' }
    const pool = {
      createTypeExpression: sinon.stub().returns({
        conditionExpression: typeConditionExpression,
        attributeNames: typeAttributeNames,
        attributeValues: typeAttributeValues
      }),
      createTimestampExpression: sinon.stub().returns({
        conditionExpression: timestampConditionExpression,
        attributeNames: timestampAttributeNames,
        attributeValues: timestampAttributeValues
      }),
      createAggregateIdExpression: sinon.stub().returns({
        conditionExpression: aggregateIdConditionExpression,
        attributeNames: aggregateIdAttributeNames,
        attributeValues: aggregateIdAttributeValues
      }),
      createQuery: sinon.stub().returns(query),
      executePaginationQuery: sinon.stub()
    }
    const filter = { aggregateIds: [], eventTypes: [] }
    const callback = sinon.stub()

    await loadEvents(pool, filter, callback)

    sinon.assert.calledWith(pool.createTypeExpression, filter)
    sinon.assert.calledWith(pool.createTimestampExpression, filter)
    sinon.assert.calledWith(pool.createAggregateIdExpression, filter)
    sinon.assert.calledWith(pool.createQuery, pool, filter, {
      aggregateIdAttributeNames,
      aggregateIdAttributeValues,
      aggregateIdConditionExpression,
      typeAttributeNames,
      typeAttributeValues,
      typeConditionExpression,
      timestampAttributeNames,
      timestampAttributeValues,
      timestampConditionExpression
    })
    sinon.assert.calledWith(pool.executePaginationQuery, pool, query, callback)
  })
})
