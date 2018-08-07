import validation from './validation'

export default {
  createList: (state, { payload: { name } }) => {
    validation.stateIsAbsent(state, 'Shopping List')

    return {
      type: 'LIST_CREATED',
      payload: { name }
    }
  },
  renameList: (state, { payload: { name } }) => {
    validation.stateExists(state, 'Shopping List')

    return {
      type: 'LIST_RENAMED',
      payload: { name }
    }
  },
  createItem: (state, { payload: { id, text } }) => {
    validation.stateExists(state, 'Shopping List')

    return {
      type: 'ITEM_CREATED',
      payload: { id, text }
    }
  },
  toggleItem: (state, { payload: { id } }) => {
    validation.stateExists(state, 'Shopping List')

    return {
      type: 'ITEM_TOGGLED',
      payload: { id }
    }
  },
  removeItem: (state, { payload: { id } }) => {
    validation.stateExists(state, 'Shopping List')

    return {
      type: 'ITEM_REMOVED',
      payload: { id }
    }
  }
}
