import { ENTITY_ITEM_ADDED, ENTITY_ITEM_REMOVED } from '../event-types'
const projection = {
  Init: () => [],
  [ENTITY_ITEM_ADDED]: (state, { payload: { itemName } }) => [
    ...state,
    itemName,
  ],
  [ENTITY_ITEM_REMOVED]: (state, { payload: { itemName } }) =>
    state.filter((item) => item !== itemName),
}
export default projection
