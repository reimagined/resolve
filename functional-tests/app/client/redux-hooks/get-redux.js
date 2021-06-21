import devTools from './enhancers/redux-devtools'
import { customCounter } from './reducers/custom-counter'

export const getRedux = () => ({
  reducers: {
    customCounter,
  },
  enhancers: [devTools],
})
