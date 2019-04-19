import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from 'resolve-testing-tools'
import fs from 'fs'
import path from 'path'

import config from './config'

describe('Read-model generic adapter API', () => {
  const {
    name,
    resolvers: resolversModule,
    projection: projectionModule,
    connectorName
  } = config.readModels.find(({ name }) => name === 'Counter')
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(`./${connectorModule}`))
    .default
  const prefix = path.join(__dirname, connectorOptions.prefix, path.sep)

  const projection = interopRequireDefault(require(`./${projectionModule}`))
    .default
  const resolvers = interopRequireDefault(require(`./${resolversModule}`))
    .default

  let connector = null
  beforeEach(async () => {
    connector = createConnector({ prefix })

    try {
      await connector.drop(null, name)
    } catch (e) {}
  })
  afterEach(async () => {
    try {
      await connector.drop(null, name)
    } catch (e) {}

    connector = null
  })

  beforeAll(() => fs.mkdirSync(prefix))
  afterAll(() => fs.rmdirSync(prefix))

  it('Insert and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INCREMENT',
        timestamp: 1,
        payload: 100
      },
      {
        aggregateId: 'ID',
        type: 'DECREMENT',
        timestamp: 2,
        payload: 200
      },
      {
        aggregateId: 'ID',
        type: 'INCREMENT',
        timestamp: 3,
        payload: 300
      }
    ])
      .readModel({
        name,
        projection,
        resolvers,
        adapter: connector
      })
      .read({})

    expect(result).toEqual(200)
  })
})
