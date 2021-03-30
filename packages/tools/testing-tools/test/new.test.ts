import givenEvents from '../src/index'
import { BDDAggregate } from '../types'
import { AggregateState, Event } from '@resolve-js/core'

const aggregate: BDDAggregate = {
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

test('aggregate', async () => {
  const result = await givenEvents()
    .aggregate(aggregate)
    .command('test')

  //console.log(result)
})

test('read model', async () => {
  givenEvents().readModel()
})

test('saga', async () => {
  givenEvents().saga()
})
