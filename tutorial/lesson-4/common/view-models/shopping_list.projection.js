import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

const projection = {
  Init: () => ({
    id: 'id',
    name: 'unnamed',
    list: [],
  }),
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
    list: [],
  }),
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => ({
    ...state,
    list: [
      ...state.list,
      {
        id,
        text,
        checked: false,
      },
    ],
  }),
}

export default projection
