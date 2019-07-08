import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from 'resolve-testing-tools'
import fs from 'fs'
import path from 'path'

import config from './config'
import resetReadModel from '../reset-read-model'

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

  connectorOptions.prefix = path.join(
    __dirname,
    connectorOptions.prefix,
    path.sep
  )

  const projection = interopRequireDefault(require(`./${projectionModule}`))
    .default
  const resolvers = interopRequireDefault(require(`./${resolversModule}`))
    .default

  let adapter = null
  beforeEach(async () => {
    await resetReadModel(createConnector, connectorOptions, name)
    adapter = createConnector(connectorOptions)
  })
  afterEach(async () => {
    await resetReadModel(createConnector, connectorOptions, name)
    adapter = null
  })

  beforeAll(() => fs.mkdirSync(connectorOptions.prefix))
  afterAll(() => fs.rmdirSync(connectorOptions.prefix))

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
        adapter: adapter
      })
      .read({})

    expect(result).toEqual(200)
  })
})
