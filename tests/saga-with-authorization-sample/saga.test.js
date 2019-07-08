import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from 'resolve-testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

describe('Saga', () => {
  const {
    name: sagaName,
    source: sourceModule,
    connectorName,
    schedulerName
  } = config.sagas.find(({ name }) => name === 'ProcessKiller')
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  const { commands: commandsModule } = config.aggregates.find(
    ({ name }) => name === 'Process'
  )

  const commands = interopRequireDefault(require(`./${commandsModule}`)).default

  let commandTimestamp = 0
  const executeCommand = ({ aggregateId, type, jwtToken, ...command }) => {
    const event = {
      ...commands[type]({}, command, jwtToken),
      aggregateId,
      timestamp: commandTimestamp++
    }
    return event
  }

  let sagaWithAdapter = null
  let adapter = null

  beforeEach(async () => {
    await resetReadModel(createConnector, connectorOptions, schedulerName)
    await resetReadModel(createConnector, connectorOptions, sagaName)

    adapter = createConnector(connectorOptions)
    sagaWithAdapter = {
      handlers: source.handlers,
      sideEffects: source.sideEffects,
      adapter,
      name: sagaName
    }
  })

  afterEach(async () => {
    await resetReadModel(createConnector, connectorOptions, schedulerName)
    await resetReadModel(createConnector, connectorOptions, sagaName)

    adapter = null
    sagaWithAdapter = null
  })

  test('success registration', async () => {
    const result = await givenEvents([
      executeCommand({
        aggregateId: 'id1',
        aggregateName: 'Process',
        type: 'createProcess'
      }),
      executeCommand({
        aggregateId: 'id2',
        aggregateName: 'Process',
        type: 'createProcess'
      }),
      executeCommand({
        aggregateId: 'id3',
        aggregateName: 'Process',
        type: 'createProcess'
      }),
      executeCommand({
        aggregateId: 'root',
        aggregateName: 'Process',
        type: 'killAllProcesses'
      })
    ]).saga(sagaWithAdapter)

    expect(result).toMatchSnapshot()
  })
})
