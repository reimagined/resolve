import { SHOPPING_ITEM_CREATED, SHOPPING_ITEM_TOGGLED } from '../eventTypes'
import validation from './validation'

export default {
  createShoppingItem: (state, { payload: { id, text } }) => {
    validation.fieldRequired({ text }, 'text')
    validation.fieldRequired({ id }, 'id')
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    }
  },
  toggleShoppingItem: (state, { payload: { id } }) => {
    validation.fieldRequired({ id }, 'id')
    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id }
    }
  }
}
