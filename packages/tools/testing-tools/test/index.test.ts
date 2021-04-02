import givenEvents, { TestAggregate } from '../src/index'
import { Event, EventHandlerEncryptionContext } from '@resolve-js/core'

const ProjectionError = (function (this: Error, message: string): void {
  Error.call(this)
  this.name = 'ProjectionError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ProjectionError)
  } else {
    this.stack = new Error().stack
  }
} as Function) as ErrorConstructor

const ResolverError = (function (this: Error, message: string): void {
  Error.call(this)
  this.name = 'ResolverError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResolverError)
  } else {
    this.stack = new Error().stack
  }
} as Function) as ErrorConstructor

describe('read model', () => {
})

describe('aggregate', () => {
  type AggregateState = {
    exist: boolean
    id?: string
  }
  const aggregate: TestAggregate = {
    name: 'user',
    projection: {
      Init: (): AggregateState => ({
        exist: false,
      }),
      TEST_COMMAND_EXECUTED: (
        state: AggregateState,
        event: Event
      ): AggregateState => ({
        ...state,
        exist: true,
        id: event.aggregateId,
      }),
    },
    commands: {
      create: (state: AggregateState, command, context): any => {
        if (context.jwt !== 'valid-user') {
          throw Error('unauthorized user')
        }
        if (state.exist) {
          throw Error('aggregate already exist')
        }
        return {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        }
      },
      failWithCustomId: (state: AggregateState, command): any => {
        if (state.exist) {
          throw Error(`aggregate ${state.id} already exist`)
        }
        throw Error(`aggregate ${command.aggregateId} failure`)
      },
      noPayload: (): any => ({
        type: 'EVENT_WITHOUT_PAYLOAD',
      }),
    },
  }

  describe('native Jest assertions', () => {
    test('expecting success command execution', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate)
          .command('create', {})
          .as('valid-user')
      ).resolves.toEqual({
        type: 'TEST_COMMAND_EXECUTED',
        payload: {},
      })
    })

    test('expecting business logic break', async () => {
      await expect(
        givenEvents([
          {
            type: 'TEST_COMMAND_EXECUTED',
            payload: {},
          },
        ])
          .aggregate(aggregate)
          .command('create', {})
          .as('valid-user')
      ).rejects.toThrow(`aggregate already exist`)
    })

    test('unauthorized user', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate)
          .command('create', {})
          .as('invalid-user')
      ).rejects.toThrow(`unauthorized user`)
    })

    test('custom aggregate id within command', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate, 'custom-id')
          .command('failWithCustomId', {})
          .as('valid-user')
      ).rejects.toThrow('aggregate custom-id failure')
    })

    test('custom aggregate id within given events', async () => {
      await expect(
        givenEvents([
          {
            type: 'TEST_COMMAND_EXECUTED',
            payload: {},
          },
        ])
          .aggregate(aggregate, 'custom-id')
          .command('failWithCustomId', {})
          .as('valid-user')
      ).rejects.toThrow(`aggregate custom-id already exist`)
    })

    test('events without payload support', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate)
          .command('noPayload')
          .as('valid-user')
      ).resolves.toEqual({
        type: 'EVENT_WITHOUT_PAYLOAD',
      })
    })
  })

  describe('with BDD assertions', () => {
    test('expecting success command execution', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('create', {})
        .as('valid-user')
        .shouldProduceEvent({
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        }))

    test('bug: promise not resolved in node version 12', async () => {
      jest.setTimeout(3000000)
      try {
        await givenEvents([])
          .aggregate(aggregate)
          .command('create', {})
          .as('valid-user')
          .shouldProduceEvent({
            type: 'ANOTHER_EVENT',
            payload: {},
          })
      } catch {}
    })

    test('expecting business logic break', () =>
      givenEvents([
        {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        },
      ])
        .aggregate(aggregate)
        .command('create', {})
        .as('valid-user')
        .shouldThrow(Error(`aggregate already exist`)))

    test('unauthorized user', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('create', {})
        .as('invalid-user')
        .shouldThrow(Error(`unauthorized user`)))

    test('custom aggregate id within command', () =>
      givenEvents([])
        .aggregate(aggregate, 'custom-id')
        .command('failWithCustomId', {})
        .as('valid-user')
        .shouldThrow(Error(`aggregate custom-id failure`)))

    test('custom aggregate id within given events', () =>
      givenEvents([
        {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        },
      ])
        .aggregate(aggregate, 'custom-id')
        .command('failWithCustomId', {})
        .as('valid-user')
        .shouldThrow(Error(`aggregate custom-id already exist`)))

    // FIXME: something wrong with resolve-command, fix after its relocation
    test.skip('events without payload support', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('noPayload')
        .as('valid-user')
        .shouldProduceEvent({
          type: 'EVENT_WITHOUT_PAYLOAD',
        }))
  })
})
