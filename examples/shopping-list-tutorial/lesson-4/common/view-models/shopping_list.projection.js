import { SHOPPING_ITEM_CREATED } from '../eventTypes'

export default {
    Init: () => [],
    [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => {
        return [...state, { id, text }]
    }
}