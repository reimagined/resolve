export default {
  Init: () => ([]),
  ITEM_CREATED: (state, { payload: { id, text } }) => ([
    ...state,
    {
      id,
      text,
      checked: false
    }
  ]),
  ITEM_TOGGLED: (state, { payload: { id } }) =>
    state.map(
      (item) => item.id === id ? ({
        ...item,
        checked: !item.checked
      }) : item
    ),
  ITEM_REMOVED: (state, { payload: { id } }) => state.filter(
    (item) => item.id !== id
  )
}
