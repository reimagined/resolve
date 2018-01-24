import 'regenerator-runtime/runtime'

import { expect } from 'chai'
import sinon from 'sinon'

import messages from '../src/messages'
import buildProjection from '../src/build_projection'
import init from '../src/init'
import reset from '../src/reset'

describe('Read model MongoDB adapter', () => {
  const DEFAULT_DICTIONARY_NAME = 'TestdefaultDictionaryStorage'
  const DEFAULT_ENTRIES = {
    id0: { content: 'test0' },
    id1: { content: 'test1' },
    id2: { content: 'test2' }
  }

  const constructStorage = () => new Map()
  let testRepository

  beforeEach(async () => {
    testRepository = { constructStorage }
  })

  afterEach(async () => {
    testRepository = null
  })

  describe('Read-side interface created by adapter init function', () => {
    let readInstance

    beforeEach(async () => {
      const defaultDictionaryStorage = await constructStorage()
      for (let key of Object.keys(DEFAULT_ENTRIES)) {
        defaultDictionaryStorage.set(key, DEFAULT_ENTRIES[key])
      }

      readInstance = init(testRepository)

      testRepository.storagesMap.set(
        DEFAULT_DICTIONARY_NAME,
        defaultDictionaryStorage
      )
    })

    afterEach(async () => {
      readInstance = null
    })

    it('should provide last timestamp as zero value', async () => {
      const lastTimestamp = await readInstance.getLastAppliedTimestamp()
      expect(lastTimestamp).to.be.equal(0)
    })

    it('should throw error on non-existing storage access', async () => {
      const readable = await readInstance.getReadable()
      const result = await readable.hget('wrong-dictionary', 'key')

      expect(result).to.be.equal(null)
    })

    it('should throw error on storage drop attempt', async () => {
      const readable = await readInstance.getReadable()

      try {
        await readable.del(DEFAULT_DICTIONARY_NAME)
        return Promise.reject(
          'dictionary drop operation should fail on read-side'
        )
      } catch (err) {
        expect(err.message).to.be.equal(
          messages.readSideForbiddenOperation('del', DEFAULT_DICTIONARY_NAME)
        )
      }
    })

    it('should provide dictionary get operation', async () => {
      const readable = await readInstance.getReadable()
      const firstResult = await readable.hget(DEFAULT_DICTIONARY_NAME, 'id0')
      const secondResult = await readable.hget(DEFAULT_DICTIONARY_NAME, 'id4')

      expect(firstResult).to.be.deep.equal({ content: 'test0' })
      expect(secondResult).to.be.deep.equal(null)
    })

    it('should throw error on dictionary set operation attempt', async () => {
      const readable = await readInstance.getReadable()

      try {
        await readable.hset(DEFAULT_DICTIONARY_NAME, 'id4', {
          content: 'test-4'
        })
        return Promise.reject(
          'dictionary set operation should fail on read-side'
        )
      } catch (err) {
        expect(err.message).to.be.equal(
          messages.readSideForbiddenOperation('hset', DEFAULT_DICTIONARY_NAME)
        )
      }
    })
  })

  describe('Write-side interface created by adapter buildProjection function', () => {
    const FIELD_NAME = 'FieldName'
    let originalTestProjection
    let builtTestProjection
    let readInstance
    let initShouldFail

    beforeEach(async () => {
      initShouldFail = false

      originalTestProjection = {
        Init: sinon.stub().callsFake(async store => {
          await new Promise((resolve, reject) =>
            setImmediate(
              () =>
                !initShouldFail ? resolve() : reject(new Error('Init Failure'))
            )
          )
        }),

        TestEvent: sinon.stub(),

        EventDictionaryGet: async store => {
          await store.hget('NEW_DICTIONARY', FIELD_NAME)
        },

        EventDictionarySet: async store => {
          await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, {
            test: 'fail'
          })
          await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, { test: 'ok' })
        },

        EventDictionaryDelete: async store => {
          await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, {
            test: 'fail'
          })
          await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, null)
        },

        EventDictionaryDrop: async store => {
          await store.hget(DEFAULT_DICTIONARY_NAME, FIELD_NAME)
          await store.del(DEFAULT_DICTIONARY_NAME)
          await store.del(DEFAULT_DICTIONARY_NAME)
        },

        WrongEvent: async () => {
          throw new Error('Projection error')
        }
      }

      builtTestProjection = buildProjection(
        testRepository,
        originalTestProjection
      )
      readInstance = init(testRepository)

      testRepository.storagesMap.set('CUSTOM_STORAGE', {
        type: 'CUSTOM_TYPE',
        content: null
      })
    })

    afterEach(async () => {
      originalTestProjection = null
      builtTestProjection = null
      initShouldFail = null
      readInstance = null
    })

    it('should raise error on read interface reinitialization', async () => {
      try {
        readInstance = init(testRepository)
        return Promise.reject("Read instance can't be initialized twice")
      } catch (err) {
        expect(err.message).to.be.equal(messages.reinitialization)
      }
    })

    it('should call Init projection function on read invocation', async () => {
      await readInstance.getReadable()
      expect(originalTestProjection.Init.callCount).to.be.equal(1)
    })

    it('should call Init projection function on read invocation only once', async () => {
      await readInstance.getReadable()
      await readInstance.getReadable()
      expect(originalTestProjection.Init.callCount).to.be.equal(1)
    })

    it('should call Init projection function on incoming event', async () => {
      await builtTestProjection.TestEvent({ type: 'TestEvent', timestamp: 10 })
      expect(originalTestProjection.Init.callCount).to.be.equal(1)
    })

    it('should call Init projection function on incoming event only once', async () => {
      await builtTestProjection.TestEvent({ type: 'TestEvent', timestamp: 10 })
      await builtTestProjection.TestEvent({ type: 'TestEvent', timestamp: 20 })
      expect(originalTestProjection.Init.callCount).to.be.equal(1)
    })

    it('should handle errors in Init projection function', async () => {
      initShouldFail = true
      const initError = await readInstance.getError()
      expect(originalTestProjection.Init.callCount).to.be.equal(1)
      expect(initError.message).to.be.equal('Init Failure')
    })

    it('should handle errors in custom projection function', async () => {
      await builtTestProjection.WrongEvent({
        type: 'WrongEvent',
        timestamp: 10
      })

      const lastError = await readInstance.getError()
      expect(lastError.message).to.be.equal('Projection error')
    })

    it('should process dictionary get operation with key autocreation', async () => {
      await builtTestProjection.EventDictionaryGet({
        type: 'EventDictionaryGet',
        timestamp: 10
      })

      const storageExists = testRepository.storagesMap.has('NEW_DICTIONARY')
      expect(storageExists).to.be.equal(true)
    })

    it('should process dictionary set operation', async () => {
      await builtTestProjection.EventDictionarySet({
        type: 'EventDictionarySet',
        timestamp: 10
      })

      const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME)
      const result = storage.get(FIELD_NAME)

      expect(result).to.be.deep.equal({ test: 'ok' })
    })

    it('should process dictionary remove operation', async () => {
      await builtTestProjection.EventDictionaryDelete({
        type: 'EventDictionaryDelete',
        timestamp: 10
      })

      const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME)
      const result = storage.has(FIELD_NAME)

      expect(result).to.be.deep.equal(false)
    })

    it('should process dropping dictionary', async () => {
      await builtTestProjection.EventDictionaryDrop({
        type: 'EventDictionaryDrop',
        timestamp: 10
      })

      const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME)

      expect(storage).to.be.deep.equal(undefined)
    })
  })

  describe('Disposing adapter with reset function', () => {
    let readInstance
    let defaultDictionaryStorage

    beforeEach(async () => {
      defaultDictionaryStorage = await constructStorage()
      for (let key of Object.keys(DEFAULT_ENTRIES)) {
        defaultDictionaryStorage.set(key, DEFAULT_ENTRIES[key])
      }

      readInstance = init(testRepository)

      testRepository.storagesMap.set(
        DEFAULT_DICTIONARY_NAME,
        defaultDictionaryStorage
      )

      await readInstance.getReadable()
    })

    afterEach(async () => {
      defaultDictionaryStorage = null
      readInstance = null
    })

    it('should close connection and dispose target dictionarys', async () => {
      const disposePromise = reset(testRepository)
      await disposePromise

      expect(testRepository.storagesMap).to.be.deep.equal(undefined)
    })

    it('should do nothing on second and following invocations', async () => {
      const firstDisposePromise = reset(testRepository)
      const secondDisposePromise = reset(testRepository)
      await firstDisposePromise
      await secondDisposePromise

      expect(firstDisposePromise).to.be.equal(secondDisposePromise)
    })
  })
})
