import givenEvents from '@resolve-js/testing-tools'
import projection from '../../common/read-models/my-aggregate-list.projection'
import resolvers from '../../common/read-models/my-aggregate-list.resolvers'
import { MY_AGGREGATE_CREATED } from '../../common/event-types'
describe('read-models', () => {
  describe('MyAggregateList', () => {
    const aggregateId = '00000000-0000-0000-0000-000000000000'
    test('resolver "all" should return created aggregates', async () => {
      const result = await givenEvents([
        {
          aggregateId,
          type: MY_AGGREGATE_CREATED,
          payload: { name: 'Test Aggregate' },
        },
      ])
        .readModel({
          name: 'MyAggregateList',
          projection,
          resolvers,
        })
        .query('all', {})
      expect(result[0]).toMatchObject({ name: 'Test Aggregate' })
    })
  })
})
