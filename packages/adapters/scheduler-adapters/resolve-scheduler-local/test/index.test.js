import createSchedulerAdapter from '../src/index'

describe('resolve-scheduler-local', () => {
  let setTimeout, clearTimeout, DateNow
  let schedulerAdapter, execute, errorHandler

  beforeEach(() => {
    setTimeout = global.setTimeout
    clearTimeout = global.clearTimeout
    DateNow = global.Date.now
    global.Date.now = jest.fn()
    global.setTimeout = jest.fn()
    global.clearTimeout = jest.fn()
    execute = jest.fn()
    errorHandler = jest.fn()
    schedulerAdapter = createSchedulerAdapter({ execute, errorHandler })
  })

  afterEach(() => {
    global.setTimeout = setTimeout
    global.clearTimeout = clearTimeout
    global.Date.now = DateNow
  })

  test('"addEntries" should add scheduler entries', async () => {
    global.setTimeout.mockImplementation(handler => {
      handler()
    })

    await schedulerAdapter.addEntries([
      { taskId: 'taskId', date: 42, command: 'command' }
    ])

    expect(execute).toBeCalledWith('taskId', 42, 'command')
  })

  test('"addEntries" should throw error when "execute" failed', async () => {
    const error = new Error()
    global.setTimeout.mockImplementation(handler => {
      handler()
    })
    execute.mockImplementation(() => {
      throw error
    })

    await schedulerAdapter.addEntries([
      { taskId: 'taskId', date: 1, command: 'command' }
    ])

    await Promise.resolve()

    expect(errorHandler).toHaveBeenCalledWith(error)
  })

  test('"addEntries" should add scheduler entries', async () => {
    let counter = 0
    global.setTimeout.mockImplementation(() => {
      return counter++
    })

    await schedulerAdapter.addEntries([
      { taskId: 'taskId-1', date: 1, command: 'command-1' },
      { taskId: 'taskId-2', date: 2, command: 'command-2' }
    ])

    await schedulerAdapter.addEntries([
      { taskId: 'taskId-3', date: 3, command: 'command-3' }
    ])

    await schedulerAdapter.clearEntries()

    expect(global.clearTimeout).toHaveBeenCalledTimes(3)
  })
})
