import Immutable from 'seamless-immutable'

export const initialState = Immutable({ optimistic: { lists: [] } })

export default {
  optimistic: (state = initialState, action) => {
    switch (action.type) {
      case 'OptimisticListCreated': {
        return { lists: [...state.lists, action.payload] }
      }
      case 'OptimisticListDeleted': {
        return {
          lists: state.lists.filter(item => {
            return item.id !== action.payload.id
          })
        }
      }
      case 'OptimisticSync': {
        return { lists: action.payload.originalLists }
      }
      default:
        return state
    }
  }
}
