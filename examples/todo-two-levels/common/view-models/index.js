const serializeState = state => JSON.stringify(state)
const deserializeState = state => JSON.parse(state)

export default [
  {
    name: 'Lists',
    projection: {
      Init: () => [],
      LIST_CREATED: (state, { aggregateId, payload: { title } }) => [
        ...state,
        {
          id: aggregateId,
          title
        }
      ],
      LIST_REMOVED: (state, { aggregateId }) =>
        state.filter(({ id }) => id !== aggregateId)
    },
    serializeState,
    deserializeState
  },
  {
    name: 'Todos',
    projection: {
      LIST_CREATED: () => ({}),
      LIST_REMOVED: () => null,
      ITEM_CREATED: (state, { payload: { id, text } }) => ({
        ...state,
        [id]: {
          text,
          checked: false
        }
      }),
      ITEM_TOGGLED: (state, { payload: { id } }) => ({
        ...state,
        [id]: {
          ...state[id],
          checked: !state[id].checked
        }
      }),
      ITEM_REMOVED: (state, { payload: { id } }) => {
        const nextState = { ...state }
        delete nextState[id]
        return nextState
      }
    },
    serializeState,
    deserializeState
  }
]
