import emptyFunction from './emtpy_function'

export default function createMockServer() {
  return {
    start: emptyFunction,
    stop: emptyFunction,
    status: 'stopping'
  }
}
