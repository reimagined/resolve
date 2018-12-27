import {
  SHOPPING_LIST_CREATED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED
} from '../eventTypes'

export default {
  Init: () => null,
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
    list: []
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
  })
}
