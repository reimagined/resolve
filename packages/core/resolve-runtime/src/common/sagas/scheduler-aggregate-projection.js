export default ({
  eventTypes: {
    SCHEDULED_COMMAND_CREATED,
    SCHEDULED_COMMAND_EXECUTED,
    SCHEDULED_COMMAND_SUCCEEDED,
    SCHEDULED_COMMAND_FAILED
  }
}) => ({
  Init: () => ({
    state: 'void'
  }),
  [SCHEDULED_COMMAND_CREATED]: (state, { payload: { date, command } }) => ({
    ...state,
    state: 'scheduled',
    date,
    command
  }),
  [SCHEDULED_COMMAND_EXECUTED]: state => ({
    ...state,
    state: 'executed'
  }),
  [SCHEDULED_COMMAND_SUCCEEDED]: state => ({
    ...state,
    state: 'succeeded'
  }),
  [SCHEDULED_COMMAND_FAILED]: state => ({
    ...state,
    state: 'failed'
  })
})
