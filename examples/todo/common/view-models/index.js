export default [
  {
    name: 'Todos',
    projection: {
      Init: () => ({}),
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
    serializeState: state => JSON.stringify(state),
    deserializeState: state => JSON.parse(state)
  }
]
