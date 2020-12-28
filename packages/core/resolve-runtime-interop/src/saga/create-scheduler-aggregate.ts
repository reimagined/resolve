import { AggregateMeta } from '../types'

type SchedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: string
  SCHEDULED_COMMAND_EXECUTED: string
  SCHEDULED_COMMAND_SUCCEEDED: string
  SCHEDULED_COMMAND_FAILED: string
}

export type SchedulerAggregateBuilder = (params: {
  schedulerName: string
  schedulerEventTypes: SchedulerEventTypes
  schedulerInvariantHash: string
}) => AggregateMeta

export const createSchedulerAggregate: SchedulerAggregateBuilder = ({
  schedulerName,
  schedulerEventTypes: {
    SCHEDULED_COMMAND_CREATED,
    SCHEDULED_COMMAND_EXECUTED,
    SCHEDULED_COMMAND_SUCCEEDED,
    SCHEDULED_COMMAND_FAILED,
  },
  schedulerInvariantHash,
}) => ({
  name: schedulerName,
  commands: {
    create: async (
      state,
      {
        payload: {
          date,
          command: { aggregateId, aggregateName, type, payload = {} },
        } = {},
      }
    ) => {
      if (
        date == null ||
        date.constructor !== Number ||
        aggregateName == null ||
        aggregateName.constructor !== String ||
        aggregateId == null ||
        aggregateId.constructor !== String ||
        type == null ||
        type.constructor !== String
      ) {
        throw Error(
          `scheduler.create: cannot create a scheduled command - bad parameters`
        )
      }

      return {
        type: SCHEDULED_COMMAND_CREATED,
        payload: {
          date,
          command: {
            aggregateId,
            aggregateName,
            type,
            payload,
          },
        },
      }
    },
    execute: async ({ state, date, command }) => {
      if (state !== 'scheduled')
        throw Error(`scheduler.execute: unexpected task state "${state}"`)

      return {
        type: SCHEDULED_COMMAND_EXECUTED,
        payload: {
          date,
          command,
        },
      }
    },
    success: async ({ state }) => {
      if (state !== 'executed')
        throw Error(`scheduler.success: unexpected task state "${state}"`)

      return {
        type: SCHEDULED_COMMAND_SUCCEEDED,
        payload: {},
      }
    },
    failure: async ({ state }, { payload: { reason } }) => {
      if (state !== 'executed')
        throw Error(`scheduler.failure: unexpected task state "${state}"`)

      return {
        type: SCHEDULED_COMMAND_FAILED,
        payload: {
          reason,
        },
      }
    },
  },
  projection: {
    Init: () => ({
      state: 'void',
    }),
    [SCHEDULED_COMMAND_CREATED]: (state, { payload: { date, command } }) => ({
      ...state,
      state: 'scheduled',
      date,
      command,
    }),
    [SCHEDULED_COMMAND_EXECUTED]: (state) => ({
      ...state,
      state: 'executed',
    }),
    [SCHEDULED_COMMAND_SUCCEEDED]: (state) => ({
      ...state,
      state: 'succeeded',
    }),
    [SCHEDULED_COMMAND_FAILED]: (state) => ({
      ...state,
      state: 'failed',
    }),
  },
  serializeState: JSON.stringify.bind(JSON),
  deserializeState: JSON.parse.bind(JSON),
  invariantHash: schedulerInvariantHash,
  encryption: () =>
    Promise.resolve({
      encrypt: () => {
        throw Error(`encryption disabled, please check your configuration`)
      },
      decrypt: () => {
        throw Error(`encryption disabled, please check your configuration`)
      },
    }),
})
