import {
  ScheduledCommandCreatedEvent,
  ScheduledCommandCreatedResult,
  ScheduledCommandExecutedResult,
  ScheduledCommandFailedResult,
  ScheduledCommandSuccessResult,
  SchedulerCreateCommand,
  SchedulerFailureCommand,
  SchedulerState,
} from './types'
import {
  schedulerEventTypes,
  schedulerInvariantHash,
  schedulerName,
} from './constants'

export const createSchedulerAggregate = () => {
  const {
    SCHEDULED_COMMAND_CREATED,
    SCHEDULED_COMMAND_EXECUTED,
    SCHEDULED_COMMAND_SUCCEEDED,
    SCHEDULED_COMMAND_FAILED,
  } = schedulerEventTypes

  return {
    name: schedulerName,
    commands: {
      create: (
        state: SchedulerState,
        {
          payload: {
            date,
            command: { aggregateId, aggregateName, type, payload },
          },
        }: SchedulerCreateCommand
      ): ScheduledCommandCreatedResult => {
        if (
          date == null ||
          aggregateName == null ||
          aggregateId == null ||
          type == null
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
      execute: ({
        state,
        date,
        command,
      }: SchedulerState): ScheduledCommandExecutedResult => {
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
      success: ({ state }: SchedulerState): ScheduledCommandSuccessResult => {
        if (state !== 'executed')
          throw Error(`scheduler.success: unexpected task state "${state}"`)

        return {
          type: SCHEDULED_COMMAND_SUCCEEDED,
          payload: {},
        }
      },
      failure: (
        { state }: SchedulerState,
        { payload: { reason } }: SchedulerFailureCommand
      ): ScheduledCommandFailedResult => {
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
      [SCHEDULED_COMMAND_CREATED]: (
        state: SchedulerState,
        { payload: { date, command } }: ScheduledCommandCreatedEvent
      ): SchedulerState => ({
        ...state,
        state: 'scheduled',
        date,
        command,
      }),
      [SCHEDULED_COMMAND_EXECUTED]: (
        state: SchedulerState
      ): SchedulerState => ({
        ...state,
        state: 'executed',
      }),
      [SCHEDULED_COMMAND_SUCCEEDED]: (
        state: SchedulerState
      ): SchedulerState => ({
        ...state,
        state: 'succeeded',
      }),
      [SCHEDULED_COMMAND_FAILED]: (state: SchedulerState): SchedulerState => ({
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
  }
}
