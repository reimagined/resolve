import partial from 'lodash.partial'
import { Command, Monitoring, SecretsManager } from '@resolve-js/core'
import { MockedCommandImplementation, SagaTestResult } from '../types'
import { getCommandImplementationKey } from './utils'

type MockedImplementations = {
  commands: Map<string, MockedCommandImplementation>
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
const executeQuery = (buffer: SagaTestResult, query: any) => {
  buffer.queries.push(query)
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
    executeQuery: partial(executeQuery, buffer),
    scheduler: makeScheduler(),
    uploader,
    getSideEffectsTimestamp: async () => sideEffectsTimestamp,
    setSideEffectsTimestamp: async (value: number) => {
      sideEffectsTimestamp = value
    },
  }
}
