import fetch from 'isomorphic-fetch'
import { handler as readModelPauseHandler } from '../src/commands/read-models/pause'
import { handler as readModelListHandler } from '../src/commands/read-models/list'
import { handler as readModelResumeHandler } from '../src/commands/read-models/resume'
import { handler as readModelResetHandler } from '../src/commands/read-models/reset'
import { handler as propsGetHandler } from '../src/commands/sagas/properties/get'
import { handler as propsListHandler } from '../src/commands/sagas/properties/list'
import { handler as propsRemoveHandler } from '../src/commands/sagas/properties/remove'
import { handler as propsSetHandler } from '../src/commands/sagas/properties/set'

describe('resolve-module-admin', () => {
  let originalConsole = null

  beforeEach(() => {
    originalConsole = global.console
    global.console = {
      log: jest.fn()
    }
  })

  afterEach(() => {
    global.console = originalConsole
    originalConsole = null
    jest.clearAllMocks()
  })
  describe('read-model', () => {
    test('pause', async () => {
      fetch().text.mockReturnValue('ListenerId = "readModel" paused')
      await readModelPauseHandler({
        url: 'url',
        readModel: 'readModel'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })

    test('reset', async () => {
      fetch().text.mockReturnValue('ListenerId = "readModel" reset')
      await readModelResetHandler({
        url: 'url',
        readModel: 'readModel'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })

    test('resume', async () => {
      fetch().text.mockReturnValue('ListenerId = "readModel" running')
      await readModelResumeHandler({
        url: 'url',
        readModel: 'readModel'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })

    test('list', async () => {
      fetch().json.mockReturnValue([
        {
          listenerId: 'listenerId',
          status: 'status',
          lastEvent: {
            timestamp: 1111111111111,
            aggregateId: 'aggregateId',
            aggregateVersion: 1,
            type: 'type',
            payload: {
              index: 1
            }
          },
          lastError: null
        }
      ])
      await readModelListHandler({
        url: 'url'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })
  })

  describe('properties', () => {
    test('get', async () => {
      fetch().text.mockReturnValue(
        'ListenerId = "saga", Key = "key", Value = "value"'
      )
      await propsGetHandler({
        url: 'url',
        saga: 'saga',
        key: 'key'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })

    test('set', async () => {
      fetch().text.mockReturnValue(
        'ListenerId = "saga", Key = "key", Value = "value"'
      )
      await propsSetHandler({
        url: 'url',
        saga: 'saga',
        key: 'key',
        value: 'value'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })

    test('remove', async () => {
      fetch().text.mockReturnValue('ListenerId = "saga", Key = "key" deleted')
      await propsRemoveHandler({
        url: 'url',
        saga: 'saga',
        key: 'key'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })

    test('list', async () => {
      fetch().json.mockReturnValue([
        {
          name: 'key',
          value: 'value'
        }
      ])
      await propsListHandler({
        url: 'url',
        saga: 'saga'
      })

      expect(console.log.mock.calls).toMatchSnapshot()
    })
  })
})
