import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents, { getSchedulersNamesBySagas } from 'resolve-testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

jest.setTimeout(1000 * 60 * 5)

describe('Saga', () => {
  const currentSaga = config.sagas.find(({ name }) => name === 'ProcessKiller')
  const { name: sagaName, source: sourceModule, connectorName } = currentSaga
  const schedulerName = getSchedulersNamesBySagas([currentSaga])[0]
  const {
    module: connectorModule,
    options: connectorOptions,
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  const { commands: commandsModule } = config.aggregates.find(
    ({ name }) => name === 'Process'
  )

  const commands = interopRequireDefault(require(`./${commandsModule}`)).default

  let commandTimestamp = 0
  const executeCommand = ({ aggregateId, type, jwt, ...command }) => {
    const event = {
      ...commands[type]({}, command, jwt),
      aggregateId,
      timestamp: commandTimestamp++,
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
      name: sagaName,
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
        type: 'createProcess',
      }),
      executeCommand({
        aggregateId: 'id2',
        aggregateName: 'Process',
        type: 'createProcess',
      }),
      executeCommand({
        aggregateId: 'id3',
        aggregateName: 'Process',
        type: 'createProcess',
      }),
      executeCommand({
        aggregateId: 'root',
        aggregateName: 'Process',
        type: 'killAllProcesses',
      }),
    ]).saga(sagaWithAdapter)

    expect(result).toMatchSnapshot()
  })
})
