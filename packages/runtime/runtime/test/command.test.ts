import { AggregatesInterop, Command, CommandError } from '@resolve-js/core'
import createCommandExecutor, { CommandExecutor } from '../src/common/command'

let performanceTracer: any
let aggregatesInterop: AggregatesInterop
let executor: CommandExecutor

const makeAggregatesInterop = (): AggregatesInterop => ({
  executeCommand: jest.fn(),
  aggregateMap: {},
})

const makeCommand = (): Command => ({
  aggregateId: 'id',
  aggregateName: 'name',
  type: 'command',
  payload: {},
})

beforeEach(() => {
  const addAnnotation = jest.fn()
  const addError = jest.fn()
  const close = jest.fn()
  const addNewSubsegment = jest.fn().mockReturnValue({
    addAnnotation,
    addError,
    close,
  })
  const getSegment = jest.fn().mockReturnValue({
    addNewSubsegment,
  })

  performanceTracer = {
    getSegment,
    addNewSubsegment,
    addAnnotation,
    addError,
    close,
  }

  aggregatesInterop = makeAggregatesInterop()

  executor = createCommandExecutor({
    performanceTracer,
    aggregatesInterop,
  })
})

afterEach(() => {
  performanceTracer = null
})

test('api assigned', async () => {
  const dynamicExecutor = executor as any
  expect(dynamicExecutor.executeCommand).toBeInstanceOf(Function)
  expect(dynamicExecutor.dispose).toBeInstanceOf(Function)
})

test('aggregate interop invoked', async () => {
  const command = makeCommand()
  await executor(command)
  expect(aggregatesInterop.executeCommand).toHaveBeenCalledWith(
    command,
    undefined
  )
})

test('disposed handler', async () => {
  await executor.dispose()
  await expect(executor(makeCommand())).rejects.toBeInstanceOf(CommandError)
})

test('duplicate dispose invocation', async () => {
  await executor.dispose()
  await expect(executor.dispose()).rejects.toBeInstanceOf(CommandError)
})

test('traced dispose', async () => {
  await executor.dispose()
  expect(performanceTracer.addNewSubsegment).toHaveBeenCalledWith('dispose')
  expect(performanceTracer.close).toHaveBeenCalled()
})

test('traced dispose error', async () => {
  await executor.dispose()
  try {
    await executor.dispose()
  } catch {}
  expect(performanceTracer.addNewSubsegment).toHaveBeenCalledWith('dispose')
  expect(performanceTracer.close).toHaveBeenCalled()
  expect(performanceTracer.addError).toHaveBeenCalled()
  expect(performanceTracer.addError.mock.calls[0][0]).toBeInstanceOf(
    CommandError
  )
})

test('dispose without performance tracer', async () => {
  executor = createCommandExecutor({
    aggregatesInterop,
  })

  await executor.dispose()
  await expect(executor(makeCommand())).rejects.toBeInstanceOf(CommandError)
})
