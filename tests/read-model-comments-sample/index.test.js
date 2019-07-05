import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from 'resolve-testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

describe('Read-model Comments sample', () => {
  const {
    name,
    resolvers: resolversModule,
    projection: projectionModule,
    connectorName
  } = config.readModels.find(({ name }) => name === 'Comments')
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default

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

  const events = [
    {
      aggregateId: 'comment-id-1',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: null,
        content: 'Level 1'
      }
    },
    {
      aggregateId: 'comment-id-2',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-1',
        content: 'Level 1.1'
      }
    },
    {
      aggregateId: 'comment-id-3',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-2',
        content: 'Level 1.1.1'
      }
    },
    {
      aggregateId: 'comment-id-4',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-2',
        content: 'Level 1.1.2'
      }
    },
    {
      aggregateId: 'comment-id-5',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-2',
        content: 'Level 1.1.3'
      }
    },
    {
      aggregateId: 'comment-id-6',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-1',
        content: 'Level 1.2'
      }
    },
    {
      aggregateId: 'comment-id-7',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-1',
        content: 'Level 1.3'
      }
    }
  ]

  test(`resolve "getComments"`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
          adapter
        })
        .getComments({})
    ).toMatchSnapshot(`getComments`)
  })
})
