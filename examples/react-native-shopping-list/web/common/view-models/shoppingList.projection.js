export default {
  Init: () => ({ name: '', list: [] }),
  LIST_CREATED: (state, { payload: { name } }) => ({
    ...state,
    name
  }),
  LIST_RENAMED: (state, { payload: { name } }) => ({
    ...state,
    name
  }),
  ITEM_CREATED: (state, { payload: { id, text } }) => ({
    ...state,
    list: [
      ...state.list,
      {
        id,
        text,
        checked: false
      }
    ]
  }),
  ITEM_TOGGLED: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.map(
      item =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked
            }
          : item
    )
  }),
  ITEM_REMOVED: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.filter(item => item.id !== id)
  })
}
