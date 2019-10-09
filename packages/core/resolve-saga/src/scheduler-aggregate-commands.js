export default ({
  eventTypes: {
    SCHEDULED_COMMAND_CREATED,
    SCHEDULED_COMMAND_EXECUTED,
    SCHEDULED_COMMAND_SUCCEEDED,
    SCHEDULED_COMMAND_FAILED
  }
}) => ({
  create: async (
    state,
    {
      payload: {
        date,
        command: { aggregateId, aggregateName, type, payload = {} }
      }
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
          payload
        }
      }
    }
  },
  execute: async ({ state, date, command }) => {
    if (state !== 'scheduled')
      throw Error(`scheduler.execute: unexpected task state "${state}"`)

    return {
      type: SCHEDULED_COMMAND_EXECUTED,
      payload: {
        date,
        command
      }
    }
  },
  success: async ({ state }) => {
    if (state !== 'executed')
      throw Error(`scheduler.success: unexpected task state "${state}"`)

    return {
      type: SCHEDULED_COMMAND_SUCCEEDED,
      payload: {}
    }
  },
  failure: async ({ state }, { payload: { reason } }) => {
    if (state !== 'executed')
      throw Error(`scheduler.failure: unexpected task state "${state}"`)

    return {
      type: SCHEDULED_COMMAND_FAILED,
      payload: {
        reason
      }
    }
  }
})
