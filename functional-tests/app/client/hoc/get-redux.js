import devTools from './enhancers/redux-devtools'

export const getRedux = () => ({
  enhancers: [devTools],
})
