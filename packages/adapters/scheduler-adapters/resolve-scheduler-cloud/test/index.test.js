import stepFunction from '../src/step-function'
import create from '../src/index'

jest.mock('../src/step-function', () => ({
  start: jest.fn(),
  stopAll: jest.fn()
}))

const context = {
  execute: jest.fn(),
  errorHandler: jest.fn()
}

let createEntry = salt => ({
  date: Date.now(),
  taskId: `taskId_${salt}`,
  command: { salt }
})

let adapter

beforeEach(() => {
  adapter = create(context)
})

afterEach(() => {
  context.execute.mockClear()
  context.errorHandler.mockClear()
  stepFunction.start.mockClear()
  stepFunction.stopAll.mockClear()
})

describe('addEntries', function() {
  test('execute state machine on entry', async () => {
    const entry = createEntry('a')
    await adapter.addEntries([entry])
    expect(stepFunction.start).toHaveBeenCalledWith(entry)
    expect(context.errorHandler).not.toHaveBeenCalled()
  })

  test('non-array argument tolerance', async () => {
    const entry = createEntry('a')
    await adapter.addEntries(entry)
    expect(stepFunction.start).toHaveBeenCalledWith(entry)
  })

  test('multiple entries', async () => {
    const entryA = createEntry('a')
    const entryB = createEntry('b')
    await adapter.addEntries([entryA, entryB])
    expect(stepFunction.start).toHaveBeenCalledWith(entryA)
    expect(stepFunction.start).toHaveBeenCalledWith(entryB)
  })

  test('no taskId', async () => {
    const entry = createEntry('a')
    entry.taskId = undefined
    await adapter.addEntries(entry)
    expect(stepFunction.start).not.toHaveBeenCalled()
    expect(context.errorHandler).toHaveBeenCalled()
  })

  test('no date', async () => {
    const entry = createEntry('a')
    entry.date = undefined
    await adapter.addEntries(entry)
    expect(stepFunction.start).not.toHaveBeenCalled()
    expect(context.errorHandler).toHaveBeenCalled()
  })

  test('no command', async () => {
    const entry = createEntry('a')
    entry.command = undefined
    await adapter.addEntries(entry)
    expect(stepFunction.start).not.toHaveBeenCalled()
    expect(context.errorHandler).toHaveBeenCalled()
  })

  test('command is empty object', async () => {
    const entry = createEntry('a')
    entry.command = {}
    await adapter.addEntries(entry)
    expect(stepFunction.start).not.toHaveBeenCalled()
    expect(context.errorHandler).toHaveBeenCalled()
  })

  test('a valid entry with invalid one', async () => {
    const entryA = createEntry('a')
    const entryB = createEntry('b')
    entryB.command = {}
    await adapter.addEntries([entryA, entryB])
    expect(stepFunction.start).toHaveBeenCalledWith(entryA)
    expect(stepFunction.start).not.toHaveBeenCalledWith(entryB)
    expect(context.errorHandler).toHaveBeenCalled()
  })

  test('handle step function failures', async () => {
    const error = Error('error')
    stepFunction.start.mockRejectedValueOnce(error)
    await adapter.addEntries(createEntry('a'))
    expect(context.errorHandler).toHaveBeenCalledWith(error)
  })
})

describe('clearEntries', () => {
  test('do not stop tasks', async () => {
    await adapter.clearEntries()
    expect(stepFunction.stopAll).not.toHaveBeenCalled()
    expect(context.errorHandler).not.toHaveBeenCalled()
  })
})

describe('executeEntries', () => {
  test('execute a command', async () => {
    const entry = createEntry('a')
    await adapter.executeEntries([entry])
    expect(context.execute).toHaveBeenCalledWith(
      entry.taskId,
      entry.date,
      entry.command
    )
    expect(context.errorHandler).not.toHaveBeenCalled()
  })

  test('non-array argument tolerance', async () => {
    const entry = createEntry('a')
    await adapter.executeEntries(entry)
    expect(context.execute).toHaveBeenCalledWith(
      entry.taskId,
      entry.date,
      entry.command
    )
    expect(context.errorHandler).not.toHaveBeenCalled()
  })

  test('execute multiple commands', async () => {
    const entryA = createEntry('a')
    const entryB = createEntry('b')
    await adapter.executeEntries([entryA, entryB])
    expect(context.execute).toHaveBeenCalledWith(
      entryA.taskId,
      entryA.date,
      entryA.command
    )
    expect(context.execute).toHaveBeenCalledWith(
      entryB.taskId,
      entryB.date,
      entryB.command
    )
  })

  test('command execution failed', async () => {
    const error = Error('error')
    context.execute.mockRejectedValueOnce(error)
    await adapter.executeEntries(createEntry('a'))
    expect(context.errorHandler).toHaveBeenCalledWith(error)
  })
})
