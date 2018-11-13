import { SHOPPING_ITEM_CREATED } from '../eventTypes'
import validation from './validation'

export default {
    createShoppingItem: (state, { payload: { text } }) => {
        validation.fieldRequired({ text }, 'text')
        return {
            type: SHOPPING_ITEM_CREATED,
            payload: { text }
        }
    }
}