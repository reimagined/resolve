import optimisticShoppingLists from './reducers/optimistic-shopping-lists'
import devToolsEnhancer from './enhancers/redux-devtools'

const getRedux = () => ({
  reducers: { optimisticShoppingLists },
  enhancers: [devToolsEnhancer],
})

export default getRedux
