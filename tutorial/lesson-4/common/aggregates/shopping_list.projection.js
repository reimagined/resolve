import { SHOPPING_LIST_CREATED } from '../eventTypes'

export default {
  // The Init function initializes a state object
  Init: () => ({}),
  // A projection function updates the state based on events.
  // Each function is associated with a single event type.
  // A projection function receives the state and an event, and returns the updated state.
  [SHOPPING_LIST_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp, // Add an event's timestamp to the state.
  }),
}
