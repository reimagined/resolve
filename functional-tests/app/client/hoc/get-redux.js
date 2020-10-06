import devTools from './enhancers/redux-devtools'

const getRedux = () => ({
  enhancers: [devTools],
})

export default getRedux
