import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED
} from '../event-types'

export default {
  Init: () => null,
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
    list: []
  }),
  [SHOPPING_LIST_REMOVED]: () => ({ removed: true }),
  [SHOPPING_LIST_RENAMED]: (state, { payload: { name } }) => ({
    ...state,
    name
  }),
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => ({
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
  [SHOPPING_ITEM_TOGGLED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.map(item =>
      item.id === id
        ? {
            ...item,
            checked: !item.checked
          }
        : item
    )
  }),
  [SHOPPING_ITEM_REMOVED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.filter(item => item.id !== id)
  })
}
