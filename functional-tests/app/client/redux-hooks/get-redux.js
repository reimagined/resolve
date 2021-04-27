import devTools from './enhancers/redux-devtools'
import { customCounter } from './reducers/custom-counter'

const getRedux = () => ({
  reducers: {
    customCounter,
  },
  enhancers: [devTools],
})

export default getRedux
