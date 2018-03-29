import emptyFunction from './emtpy_function'

export default function getMockServer() {
  return {
    start: emptyFunction,
    stop: emptyFunction,
    status: 'stopping'
  }
}
