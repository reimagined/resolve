import optimisticShoppingLists from './reducers/optimistic_shopping_lists'
import devToolsEnhancer from './enhancers/redux-devtools'

const getRedux = () => ({
  reducers: { optimisticShoppingLists },
  enhancers: [devToolsEnhancer]
})

export default getRedux
