import optimisticShoppingLists from './reducers/optimistic_shopping_lists'
import { devToolsEnhancer } from 'redux-devtools-extension'

const getRedux = () => ({
  reducers: { optimisticShoppingLists },
  enhancers: [devToolsEnhancer()]
})

export default getRedux
