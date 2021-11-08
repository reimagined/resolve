import createMemoryAdapter from '@resolve-js/readmodel-lite'

export const getReadModelAdapter = () => {
  return createMemoryAdapter({
    databaseFile: ':memory:',
  })
}
