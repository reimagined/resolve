// mdis-start
import createStorageLiteAdapter from 'resolve-storage-lite'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import newsAggregate from './news-aggregate'
// mdis-stop

test('resolve-command', async () => {
  // mdis-start
  const aggregates = [newsAggregate]
  const memoryStorage = createStorageLiteAdapter({ databaseFile: ':memory:' })
  const eventStore = createEventStore({ storage: memoryStorage })

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates
  })

  const event = await executeCommand({
    aggregateId: 'aggregate-id',
    aggregateName: 'news',
    type: 'createNews',
    payload: {
      title: 'News',
      userId: 'user-id',
      text: 'News content'
    }
  })
  // mdis-stop

  expect(event.payload.text).toEqual('News content')
})
