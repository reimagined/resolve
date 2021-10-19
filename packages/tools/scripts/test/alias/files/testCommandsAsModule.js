import path from 'path'
import localDependency from './testLocalDependency'

const commandsAsModule = () => ({
  create: (state, event) => ({ type: 'CREATE', payload: event.payload }),
  update: (state, event) => ({ type: 'UPDATE', payload: event.payload }),
  remove: (state, event) => {
    const test1 = path.readFile.name
    const test2 = localDependency
    return { type: 'REMOVE', payload: event.payload, test1, test2 }
  },
})

export default commandsAsModule
