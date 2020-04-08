import {
  withConnection,
  wrapDispose,
  createAdapter
} from '../src/create-adapter'
import {
  ResourceAlreadyExistError,
  ResourceNotExistError
} from '../src/resource-errors'
import '../src/index'

describe('Resource errors', () => {
  test('should provide ResourceAlreadyExistError', () => {
    try {
      throw new ResourceAlreadyExistError('Message')
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceAlreadyExistError)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Message')
      expect(error.code).toEqual(406)
    }
  })

  test('should provide ResourceNotExistError', () => {
    try {
      throw new ResourceNotExistError('Message')
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceNotExistError)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Message')
      expect(error.code).toEqual(410)
    }
  })
})

describe('Create snapshot base adapter', () => {
  test('should use withConnection on first connection', async () => {
    const [connect, method] = [jest.fn(), jest.fn().mockReturnValue('Result')]
    const pool = {}

    const result = await withConnection(pool, connect, method, 'Argument')

    expect(method).toBeCalledWith(pool, 'Argument')
    expect(pool.connectionPromise).toBeInstanceOf(Promise)

    expect(result).toEqual('Result')
  })

  test('should use withConnection on second connection', async () => {
    const [connect, method] = [jest.fn(), jest.fn().mockReturnValue('Result')]
    const connectionPromise = Promise.resolve()
    const pool = { connectionPromise }

    const result = await withConnection(pool, connect, method, 'Argument')

    expect(method).toBeCalledWith(pool, 'Argument')
    expect(pool.connectionPromise).toEqual(connectionPromise)

    expect(result).toEqual('Result')
  })

  test('should use withConnection while disposed', async () => {
    const [connect, method] = [jest.fn(), jest.fn().mockReturnValue('Result')]
    const pool = { disposed: true }

    try {
      await withConnection(pool, connect, method)

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)

      expect(error.message).toEqual('Adapter is disposed')
    }
  })

  test('should use wrap for dispose', async () => {
    const dispose = jest.fn()
    const pool = {}

    await wrapDispose(dispose, pool, 'Argument')

    expect(dispose).toBeCalledWith(pool, 'Argument')
    expect(pool.disposed).toEqual(true)
  })

  test('should wrap methods for connect and dispose', async () => {
    const methods = {
      connect: jest.fn(),
      loadSnapshot: jest.fn(),
      saveSnapshot: jest.fn(),
      dropSnapshot: jest.fn(),
      init: jest.fn(),
      drop: jest.fn(),
      dispose: jest.fn()
    }
    const imports = {
      resource: {}
    }
    const config = {
      option: 'option'
    }

    const adapter = createAdapter(
      { withConnection, wrapDispose },
      methods,
      imports,
      config
    )
    await adapter.loadSnapshot()

    const pool = methods.loadSnapshot.mock.calls[0][0]

    expect(pool.resource).toEqual(imports.resource)
    expect(pool.config).toEqual(config)
  })
})
