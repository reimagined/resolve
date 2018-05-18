import emptyFunction from './emtpy_function'

const getMockServer = () => ({
  start: emptyFunction,
  stop: emptyFunction,
  status: 'stopping'
})

export default getMockServer
