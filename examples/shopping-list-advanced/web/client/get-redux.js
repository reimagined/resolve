import optimisticShoppingListsSaga from './redux/sagas/optimistic-shopping-lists-saga'
import optimisticShoppingListsReducer from './redux/reducers/optimistic-shopping-lists'

import optimisticSharingsSaga from './redux/sagas/optimistic-sharings-saga'
import optimisticSharingsReducer from './redux/reducers/optimistic-sharings'

const getRedux = () => ({
  reducers: {
    optimisticSharings: optimisticSharingsReducer,
    optimisticShoppingLists: optimisticShoppingListsReducer,
    jwt: (jwt = {}) => jwt,
  },
  sagas: [optimisticSharingsSaga, optimisticShoppingListsSaga],
})

export default getRedux
