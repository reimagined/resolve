import { SHOPPING_ITEM_CREATED, SHOPPING_ITEM_TOGGLED } from '../eventTypes'

export default {
  Init: () => [],
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => {
    return [...state, { id, text }]
  },
  [SHOPPING_ITEM_TOGGLED]: (state, { payload: { id } }) => [
    ...state.map(
      item =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked
            }
          : item
    )
  ]
}
