import partial from 'lodash.partial'
import {
  Command,
  Monitoring,
  ReadModelQuery,
  SecretsManager,
} from '@resolve-js/core'
import {
  MockedCommandImplementation,
  MockedQueryImplementation,
  SagaTestResult,
} from '../types'
import { getCommandImplementationKey, getQueryImplementationKey } from './utils'

type MockedImplementations = {
  commands: Map<string, MockedCommandImplementation>
  queries: Map<string, MockedQueryImplementation>
}

const executeCommand = async (
  buffer: SagaTestResult,
  schedulerName: string,
  mockedImplementations: Map<string, MockedCommandImplementation>,
  command: Command
) => {
  if (command.aggregateName === schedulerName) {
    const payload = command.payload
    buffer.scheduledCommands.push({
      date: payload.date,
      command: payload.command,
    })
  } else {
    buffer.commands.push(command)
    const implementation = mockedImplementations.get(
      getCommandImplementationKey(command)
    )
    if (typeof implementation === 'function') {
      await implementation(command)
    }
  }
}
const executeQuery = async (
  buffer: SagaTestResult,
  mockedImplementations: Map<string, MockedQueryImplementation>,
  query: ReadModelQuery
) => {
  buffer.queries.push(query)
  const implementation = mockedImplementations.get(
    getQueryImplementationKey(query)
  )
  if (typeof implementation === 'function') {
    await implementation(query)
  }
}

const makeScheduler = () => ({
  addEntries: () => void 0,
  clearEntries: () => void 0,
  executeEntries: () => void 0,
})

export const getSagaRuntime = (
  buffer: SagaTestResult,
  mockedImplementations: MockedImplementations,
  schedulerName: string,
  secretsManager: SecretsManager,
  monitoring: Monitoring,
  sideEffectsStartTimestamp: number,
  uploader = null
) => {
  let sideEffectsTimestamp = sideEffectsStartTimestamp

  return {
    secretsManager,
    monitoring,
    executeCommand: partial(
      executeCommand,
      buffer,
      schedulerName,
      mockedImplementations.commands
    ),
    executeQuery: partial(executeQuery, buffer, mockedImplementations.queries),
    scheduler: makeScheduler(),
    uploader,
    getSideEffectsTimestamp: async (sagaName: string) => {
      void sagaName
      return sideEffectsTimestamp
    },
    setSideEffectsTimestamp: async (sagaName: string, value: number) => {
      void sagaName
      sideEffectsTimestamp = value
    },
  }
}
