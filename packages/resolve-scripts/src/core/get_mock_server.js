import emptyFunction from './empty_function'

const getMockServer = () => ({
  start: emptyFunction,
  stop: emptyFunction,
  status: 'stopping'
})

export default getMockServer
