import createMemoryAdapter from '@resolve-js/readmodel-lite'

export const getReadModelAdapter = async () => {
  return createMemoryAdapter({
    databaseFile: ':memory:',
  })
}
