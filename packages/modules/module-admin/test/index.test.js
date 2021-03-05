import fetch from 'isomorphic-fetch'
import { handler as readModelPauseHandler } from '../src/commands/read-models/pause'
import { handler as readModelListHandler } from '../src/commands/read-models/list'
import { handler as readModelResumeHandler } from '../src/commands/read-models/resume'
import { handler as readModelResetHandler } from '../src/commands/read-models/reset'
import { handler as sagaPauseHandler } from '../src/commands/sagas/pause'
import { handler as sagaListHandler } from '../src/commands/sagas/list'
import { handler as sagaResumeHandler } from '../src/commands/sagas/resume'
import { handler as sagaResetHandler } from '../src/commands/sagas/reset'
import { handler as propsGetHandler } from '../src/commands/sagas/properties/get'
import { handler as propsListHandler } from '../src/commands/sagas/properties/list'
import { handler as propsRemoveHandler } from '../src/commands/sagas/properties/remove'
import { handler as propsSetHandler } from '../src/commands/sagas/properties/set'
import { handler as eventStoreFreezeHandler } from '../src/commands/event-store/freeze'
import { handler as eventStoreUnfreezeHandler } from '../src/commands/event-store/unfreeze'
import { handler as eventStoreImportHandler } from '../src/commands/event-store/import'
import { handler as eventStoreExportHandler } from '../src/commands/event-store/export'
import { handler as eventStoreIncrementalImportHandler } from '../src/commands/event-store/incremental-import'

/* eslint-disable no-console */
describe('@resolve-js/module-admin', () => {
  let originalConsole = null

  beforeEach(() => {
    originalConsole = global.console
    global.console = {
      log: jest.fn(),
    }
  })

  afterEach(() => {
    global.console = originalConsole
    originalConsole = null
    jest.clearAllMocks()
  })

  describe('event-store', () => {
    test('freeze', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreFreezeHandler({
        url: 'url',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('unfreeze', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreUnfreezeHandler({
        url: 'url',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('import', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreImportHandler({
        url: 'url',
        directory: 'directory',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })
    test('import: maintenanceMode=manual', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreImportHandler({
        url: 'url',
        directory: 'directory',
        maintenanceMode: 'manual',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })
    test('import: maintenanceMode=auto', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreImportHandler({
        url: 'url',
        directory: 'directory',
        maintenanceMode: 'auto',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('export', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreExportHandler({
        url: 'url',
        directory: 'directory',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('export: maintenanceMode=manual', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreExportHandler({
        url: 'url',
        directory: 'directory',
        maintenanceMode: 'manual',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('export: maintenanceMode=auto', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreExportHandler({
        url: 'url',
        directory: 'directory',
        maintenanceMode: 'auto',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('incremental import', async () => {
      fetch().text.mockReturnValue('ok')
      await eventStoreIncrementalImportHandler({
        url: 'url',
        filePath: 'filePath',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })
  })

  describe('read-models', () => {
    test('pause', async () => {
      fetch().text.mockReturnValue('ListenerId = "readModel" paused')
      await readModelPauseHandler({
        url: 'url',
        readModel: 'readModel',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('reset', async () => {
      fetch().text.mockReturnValue('ListenerId = "readModel" reset')
      await readModelResetHandler({
        url: 'url',
        readModel: 'readModel',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('resume', async () => {
      fetch().text.mockReturnValue('ListenerId = "readModel" running')
      await readModelResumeHandler({
        url: 'url',
        readModel: 'readModel',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('list', async () => {
      fetch().json.mockReturnValue([
        {
          eventSubscriber: 'read-model',
          status: 'status',
          successEvent: {
            timestamp: 1111111111111,
            aggregateId: 'aggregateId',
            aggregateVersion: 1,
            type: 'type',
            payload: {
              index: 1,
            },
          },
          failedEvent: null,
          errors: null,
        },
      ])
      await readModelListHandler({
        url: 'url',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })
  })

  describe('sagas', () => {
    test('pause', async () => {
      fetch().text.mockReturnValue('ListenerId = "saga" paused')
      await sagaPauseHandler({
        url: 'url',
        saga: 'saga',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('reset', async () => {
      fetch().text.mockReturnValue('ListenerId = "saga" reset')
      await sagaResetHandler({
        url: 'url',
        saga: 'saga',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('resume', async () => {
      fetch().text.mockReturnValue('ListenerId = "saga" running')
      await sagaResumeHandler({
        url: 'url',
        saga: 'saga',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    test('list', async () => {
      fetch().json.mockReturnValue([
        {
          eventSubscriber: 'saga',
          status: 'status',
          successEvent: {
            timestamp: 1111111111111,
            aggregateId: 'aggregateId',
            aggregateVersion: 1,
            type: 'type',
            payload: {
              index: 1,
            },
          },
          failedEvent: null,
          errors: null,
        },
      ])
      await sagaListHandler({
        url: 'url',
      })

      expect(fetch.mock.calls).toMatchSnapshot('fetch')
      expect(console.log.mock.calls).toMatchSnapshot('console.log')
    })

    describe('properties', () => {
      test('get', async () => {
        fetch().text.mockReturnValue(
          'ListenerId = "saga", Key = "key", Value = "value"'
        )
        await propsGetHandler({
          url: 'url',
          saga: 'saga',
          key: 'key',
        })

        expect(fetch.mock.calls).toMatchSnapshot('fetch')
        expect(console.log.mock.calls).toMatchSnapshot('console.log')
      })

      test('set', async () => {
        fetch().text.mockReturnValue(
          'ListenerId = "saga", Key = "key", Value = "value"'
        )
        await propsSetHandler({
          url: 'url',
          saga: 'saga',
          key: 'key',
          value: 'value',
        })

        expect(fetch.mock.calls).toMatchSnapshot('fetch')
        expect(console.log.mock.calls).toMatchSnapshot('console.log')
      })

      test('remove', async () => {
        fetch().text.mockReturnValue('ListenerId = "saga", Key = "key" deleted')
        await propsRemoveHandler({
          url: 'url',
          saga: 'saga',
          key: 'key',
        })

        expect(fetch.mock.calls).toMatchSnapshot('fetch')
        expect(console.log.mock.calls).toMatchSnapshot('console.log')
      })

      test('list', async () => {
        fetch().json.mockReturnValue([
          {
            name: 'key',
            value: 'value',
          },
        ])
        await propsListHandler({
          url: 'url',
          saga: 'saga',
        })

        expect(fetch.mock.calls).toMatchSnapshot('fetch')
        expect(console.log.mock.calls).toMatchSnapshot('console.log')
      })
    })
  })
})
/* eslint-enable no-console */
