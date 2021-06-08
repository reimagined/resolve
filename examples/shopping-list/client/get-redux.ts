import optimisticShoppingListsSaga from './sagas/optimistic_shopping_lists_saga'
import optimisticShoppingListsReducer from './reducers/optimistic_shopping_lists'
import reduxDevToolsEnhancer from './enhancers/redux-devtools'

const getRedux = () => ({
  reducers: {
    optimisticShoppingLists: optimisticShoppingListsReducer,
    jwt: (jwt = {}) => jwt,
  },
  sagas: [optimisticShoppingListsSaga],
  enhancers: [reduxDevToolsEnhancer],
})

export default getRedux
