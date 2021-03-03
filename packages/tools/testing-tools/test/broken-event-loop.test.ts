import createReadModelConnector from '@resolve-js/readmodel-lite'
import givenEvents from '../src/index'
import path from 'path'
import fs from 'fs'
import os from 'os'

const getReadModelConnector = async () => {
  const databaseFile = path.join(os.tmpdir(), 'test.db')
  const dbFileExists = await new Promise((resolve) =>
    fs.exists(databaseFile, resolve)
  )
  if (dbFileExists) {
    await new Promise((resolve, reject) =>
      fs.unlink(databaseFile, (err) =>
        !err ? resolve(undefined) : reject(err)
      )
    )
  }
  return await createReadModelConnector({ databaseFile })
}

const inputEvents = [
  { aggregateId: 'id1', type: 'TEST1' },
  { aggregateId: 'id2', type: 'TEST2' },
  { aggregateId: 'id3', type: 'TEST3' },
]

const readModelProjection = {
  Init: async (store: any) =>
    await store.defineTable('items', { indexes: { id: 'string' }, fields: [] }),
  TEST1: async (store: any) => await store.insert('items', { id: 1 }),
  TEST2: async (store: any) => await store.insert('items', { id: 2 }),
  TEST3: async (store: any) => await store.insert('items', { id: 3 }),
}

const readModelBrokenProjection = {
  Init: async (store: any) => {
    throw Error('something wrong')
  },
}

const readModelResolvers = {
  all: async (store: any, args: any, context: any) => ({
    items: await store.find('items', {}, { id: 1 }, { id: 1 }),
    args,
    context,
  }),
}

test('async call during building', async () => {
  const result = await givenEvents(inputEvents)
    .readModel({
      name: 'readModelName',
      projection: readModelProjection,
      resolvers: readModelResolvers,
      adapter: await getReadModelConnector(),
    })
    .all({ a: 10, b: 20 })
    .as('JWT_TOKEN')

  expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
})

test('async call before building', async () => {
  const adapter = await getReadModelConnector()
  const result = await givenEvents(inputEvents)
    .readModel({
      name: 'readModelName',
      projection: readModelProjection,
      resolvers: readModelResolvers,
      adapter,
    })
    .all({ a: 10, b: 20 })
    .as('JWT_TOKEN')

  expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
})

test('bug: promise never completes on hard error', async () => {
  const adapter = await getReadModelConnector()
  try {
    await givenEvents(inputEvents)
      .readModel({
        name: 'readModelName',
        projection: readModelBrokenProjection,
        resolvers: readModelResolvers,
        adapter,
      })
      .all({ a: 10, b: 20 })
      .as('JWT_TOKEN')
  } catch {}
})
