import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

// A View Model's projection is defined in a format that is isomorphic with a Redux reducer format.
const projection = {
  // The 'Init' function initializes the View Model's state object.
  Init: () => ({
    id: 'id',
    name: 'unnamed',
    list: [],
  }),
  // Below is a projection function. It runs on every event of the specified type, whose aggregate Id matches one of the Ids specified in the query.
  // A View Model projection takes the state and returns its updated version based on the event data.
  // When all events are applied, the built state is passed to the client in the response body.
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    // Assign the actual aggregate ID and name to the response.
    id: aggregateId,
    name,
    list: [],
  }),
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => ({
    ...state,
    // Add a shopping list item to a list within the state object.
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
