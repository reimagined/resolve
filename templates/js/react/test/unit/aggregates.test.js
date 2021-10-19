import givenEvents from '@resolve-js/testing-tools'
import commands from '../../common/aggregates/my-aggregate.commands'
import projection from '../../common/aggregates/my-aggregate.projection'
import {
  MY_AGGREGATE_CREATED,
  MY_AGGREGATE_ITEM_ADDED,
} from '../../common/event-types'
describe('aggregates', () => {
  describe('MyAggregate', () => {
    it('"create" command executes successfully', async () => {
      await givenEvents([])
        .aggregate({ name: 'MyAggregate', commands, projection })
        .command('create', { name: 'Test Aggregate' })
        .shouldProduceEvent({
          type: MY_AGGREGATE_CREATED,
          payload: { name: 'Test Aggregate' },
        })
    })
    it('"addItem" command executes successfully', async () => {
      await givenEvents([
        {
          type: MY_AGGREGATE_CREATED,
          payload: { name: 'Test Aggregate' },
        },
      ])
        .aggregate({ name: 'MyAggregate', commands, projection })
        .command('addItem', { name: 'Test Aggregate' })
        .shouldProduceEvent({
          type: MY_AGGREGATE_ITEM_ADDED,
          payload: { itemName: 'Item 0' },
        })
    })
    it('"addItem" command throws for non-exiting aggregate', async () => {
      await givenEvents([])
        .aggregate({ name: 'MyAggregate', commands, projection })
        .command('addItem', { name: 'Test Aggregate' })
        .shouldThrow(Error('Aggregate does not exist'))
    })
  })
})
