const projection = {
  Init: () => ({
    some: 100,
    state: 200,
    content: 300
  }),

  EVENT_APPEARED: (state, event) => {
    const nextState = {
      ...state,
      modified: 400,
      content: 500
    }

    return nextState
  }
}

export default projection
