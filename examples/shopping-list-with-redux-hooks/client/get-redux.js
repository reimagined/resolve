import optimisticShoppingLists from './reducers/optimistic-shopping-lists'
import devToolsEnhancer from './enhancers/redux-devtools'

const getRedux = () => ({
  reducers: { optimisticShoppingLists, jwt: (jwt = {}) => jwt },
  enhancers: [devToolsEnhancer],
})

export default getRedux
