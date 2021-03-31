import givenEvents from '../src/index'
import { BDDAggregate } from '../types'
import { AggregateState, Event } from '@resolve-js/core'

describe('givenEvents', () => {
  test('incomplete test: should provide test object', async () => {
    expect.assertions(1)
    try {
      await givenEvents()
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining('aggregate'))
    }
  })
})

describe('aggregate', () => {
  const aggregate: BDDAggregate = {
    name: 'user',
    projection: {
      Init: (): AggregateState => ({
        exist: false,
      }),
    },
    commands: {},
  }

  test('incomplete test: should provide a command', async () => {
    expect.assertions(1)
    try {
      await givenEvents().aggregate(aggregate)
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining('provide a command'))
    }
  })

  test('complete test: user assertion mode', async () => {
    await givenEvents().aggregate(aggregate).command('test')
  })

  test('complete test: user assertion mode with auth', async () => {
    await givenEvents().aggregate(aggregate).command('test').as('user')
  })

  test('init error: setting auth after test execution', async () => {
    const test = givenEvents().aggregate(aggregate).command('test')
    await test
    expect.assertions(1)
    try {
      test.as('user')
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })
})

test('read model', async () => {
  givenEvents().readModel()
})

test('saga', async () => {
  givenEvents().saga()
})
