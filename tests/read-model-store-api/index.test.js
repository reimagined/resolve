import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

jest.setTimeout(1000 * 60 * 5)

describe('Read-model Store API', () => {
  const createConnector = interopRequireDefault(
    require('@resolve-js/readmodel-lite')
  ).default

  const resolvers = interopRequireDefault(require(`./resolvers`)).default

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(`resolve "all"`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = interopRequireDefault(
      require(`./update/increment-undefined-key`)
    ).default

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
          adapter,
        })
        .all({})
    ).toMatchSnapshot()
  })
})
