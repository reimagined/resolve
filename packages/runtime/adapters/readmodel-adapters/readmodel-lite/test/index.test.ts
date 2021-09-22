import fs from 'fs'
import path from 'path'

import createReadModelAdapter from '../src'

describe('@resolve-js/readmodel-lite', () => {
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let adapter = null! as ReturnType<typeof createReadModelAdapter>

  for (const { describeName, databaseFile, clear } of [
    {
      describeName: 'with { databaseFile: ":memory:" }',
      databaseFile: ':memory:',
      //eslint-disable-next-line @typescript-eslint/no-empty-function
      clear: () => {},
    },
    {
      describeName: 'with { databaseFile: "./temp.db" }',
      databaseFile: path.join(__dirname, 'temp.db'),
      clear: () => {
        const databaseFile = path.join(__dirname, 'temp.db')
        fs.unlinkSync(`${databaseFile}`)
        try {
          fs.unlinkSync(`${databaseFile}-journal`)
        } catch (err) {}
        try {
          fs.unlinkSync(`${databaseFile}-shm`)
        } catch (err) {}
        try {
          fs.unlinkSync(`${databaseFile}-wal`)
        } catch (err) {}
      },
    },
  ]) {
    // eslint-disable-next-line no-loop-func
    describe(describeName, () => {
      beforeEach(() => {
        adapter = createReadModelAdapter({
          databaseFile,
        })
      })

      afterEach(() => {
        clear()
      })

      test('methods "defineTable", "insert", "update", "count", "delete"', async () => {
        const readModelName = 'readModelName'

        const store = await adapter.connect(readModelName)
        await adapter.subscribe(
          store,
          readModelName,
          null,
          null,
          async () => null
        )

        await store.defineTable('ShoppingLists', {
          indexes: {
            id: 'string',
          },
          fields: ['createdAt', 'name'],
        })

        await store.insert('ShoppingLists', {
          id: 'id-1',
          name: 'Products',
          createdAt: 1,
        })

        await store.insert('ShoppingLists', {
          id: 'id-2',
          name: 'Medicines',
          createdAt: 2,
        })

        await store.update(
          'ShoppingLists',
          { id: 'id-1' },
          { $set: { name: 'Products-NEW' } }
        )

        await store.update(
          'ShoppingLists',
          { id: 'id-1' },
          { $set: { name: 'Products-NEW' } },
          { upsert: true }
        )

        await store.delete('ShoppingLists', {
          id: 'id-2',
        })

        await store.update(
          'ShoppingLists',
          { id: 'id-3' },
          { $set: { name: 'Entries' } },
          { upsert: true }
        )

        expect(await store.count('ShoppingLists', {})).toEqual(2)

        await adapter.unsubscribe(store, readModelName, async () => null)
        await adapter.disconnect(store)
      })

      test('methods "defineTable", "insert", "find", "findOne"', async () => {
        const readModelName = 'readModelName'

        const store = await adapter.connect(readModelName)
        await adapter.subscribe(
          store,
          readModelName,
          null,
          null,
          async () => null
        )

        await store.defineTable('Entries', {
          indexes: {
            id: 'string',
          },
          fields: ['name'],
        })

        await store.insert('Entries', {
          id: 'id-1',
          name: 'First entry',
        })

        await store.insert('Entries', {
          id: 'id-2',
          name: 'Second entry',
        })

        await store.insert('Entries', {
          id: 'id-3',
          name: 'Second entry',
        })

        await store.insert('Entries', {
          id: 'id-4',
          name: 'First entry',
        })

        await store.insert('Entries', {
          id: 'id-5',
          name: 'Second entry',
        })

        expect(await store.find('Entries', {}, {}, { id: 1 })).toEqual([
          {
            id: 'id-1',
            name: 'First entry',
          },
          {
            id: 'id-2',
            name: 'Second entry',
          },
          {
            id: 'id-3',
            name: 'Second entry',
          },
          {
            id: 'id-4',
            name: 'First entry',
          },
          {
            id: 'id-5',
            name: 'Second entry',
          },
        ])

        expect(await store.find('Entries', {}, {}, { id: -1 })).toEqual([
          {
            id: 'id-5',
            name: 'Second entry',
          },
          {
            id: 'id-4',
            name: 'First entry',
          },
          {
            id: 'id-3',
            name: 'Second entry',
          },
          {
            id: 'id-2',
            name: 'Second entry',
          },
          {
            id: 'id-1',
            name: 'First entry',
          },
        ])

        expect(await store.findOne('Entries', { id: 'id-3' })).toEqual({
          id: 'id-3',
          name: 'Second entry',
        })

        expect(
          await store.find('Entries', {
            $or: [
              { $and: [{ name: 'Second entry', id: 'id-2' }] },
              { $not: { id: { $gte: 'id-1' } } },
            ],
          })
        ).toEqual([
          {
            id: 'id-2',
            name: 'Second entry',
          },
        ])

        await adapter.unsubscribe(store, readModelName, async () => null)

        await adapter.disconnect(store)
      })

      test('method "drop"', async () => {
        const readModelName1 = 'readModelName1'
        const readModelName2 = 'readModelName2'

        const store1 = await adapter.connect(readModelName1)
        const store2 = await adapter.connect(readModelName2)
        await adapter.subscribe(
          store1,
          readModelName1,
          null,
          null,
          async () => null
        )
        await adapter.subscribe(
          store2,
          readModelName2,
          null,
          null,
          async () => null
        )

        await store1.defineTable('table1', {
          indexes: {
            id: 'string',
          },
          fields: ['test'],
        })

        await store1.insert('table1', {
          id: 'id-1',
          test: true,
        })

        await store1.insert('table1', {
          id: 'id-2',
          test: true,
        })

        await store2.defineTable('table2', {
          indexes: {
            id: 'string',
          },
          fields: ['test'],
        })

        await store2.insert('table2', {
          id: 'id-3',
          test: true,
        })

        await store2.insert('table2', {
          id: 'id-4',
          test: true,
        })

        await store2.insert('table2', {
          id: 'id-5',
          test: true,
        })

        expect(await store1.count('table1', {})).toEqual(2)

        expect(await store2.count('table2', {})).toEqual(3)

        await adapter.unsubscribe(store1, readModelName1, async () => null)
        await adapter.unsubscribe(store2, readModelName2, async () => null)

        await adapter.disconnect(store1)
        await adapter.disconnect(store2)
      })

      test('method "disconnect"', async () => {
        const readModelName1 = 'readModelName1'
        const readModelName2 = 'readModelName2'

        const store1 = await adapter.connect(readModelName1)
        const store2 = await adapter.connect(readModelName2)
        await adapter.subscribe(
          store1,
          readModelName1,
          null,
          null,
          async () => null
        )
        await adapter.subscribe(
          store2,
          readModelName2,
          null,
          null,
          async () => null
        )

        await store1.defineTable('table1', {
          indexes: {
            id: 'string',
          },
          fields: ['test'],
        })

        await store1.insert('table1', {
          id: 'id-1',
          test: true,
        })

        await store1.insert('table1', {
          id: 'id-2',
          test: true,
        })

        await store2.defineTable('table2', {
          indexes: {
            id: 'string',
          },
          fields: ['test'],
        })

        await store2.insert('table2', {
          id: 'id-3',
          test: true,
        })

        await store2.insert('table2', {
          id: 'id-4',
          test: true,
        })

        await store2.insert('table2', {
          id: 'id-5',
          test: true,
        })

        expect(await store1.count('table1', {})).toEqual(2)

        expect(await store2.count('table2', {})).toEqual(3)

        await adapter.unsubscribe(store1, readModelName1, async () => null)
        await adapter.unsubscribe(store2, readModelName2, async () => null)

        await adapter.disconnect(store1)
        await adapter.disconnect(store2)
      })

      test('operator "$inc"', async () => {
        const readModelName = 'readModelName'

        const store = await adapter.connect(readModelName)
        await adapter.subscribe(
          store,
          readModelName,
          null,
          null,
          async () => null
        )

        await store.defineTable('values', {
          indexes: {
            id: 'string',
          },
          fields: ['value', 'arr', 'obj'],
        })

        await store.insert('values', {
          id: 'id-1',
          value: 1,
          obj: {
            value: 1,
          },
          arr: [
            {
              value: 1,
            },
          ],
        })

        expect(
          await store.findOne('values', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 1,
          obj: {
            value: 1,
          },
          arr: [
            {
              value: 1,
            },
          ],
        })

        await store.update(
          'values',
          {
            id: 'id-1',
          },
          {
            $inc: {
              value: 1,
              'obj.value': 1,
              'arr.0.value': 1,
            },
          }
        )

        expect(
          await store.findOne('values', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 2,
          obj: {
            value: 2,
          },
          arr: [
            {
              value: 2,
            },
          ],
        })

        await store.update(
          'values',
          {
            id: 'id-1',
          },
          {
            $inc: {
              value: -1,
              'obj.value': -1,
              'arr.0.value': -1,
            },
          }
        )

        expect(
          await store.findOne('values', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 1,
          obj: {
            value: 1,
          },
          arr: [
            {
              value: 1,
            },
          ],
        })

        await store.update(
          'values',
          {
            id: 'id-1',
          },
          {
            $inc: {
              value: 0.42,
              'obj.value': 0.42,
              'arr.0.value': 0.42,
            },
          }
        )

        expect(
          await store.findOne('values', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 1.42,
          obj: {
            value: 1.42,
          },
          arr: [
            {
              value: 1.42,
            },
          ],
        })

        await store.update(
          'values',
          {
            id: 'id-1',
          },
          {
            $inc: {
              value: -0.42,
              'obj.value': -0.42,
              'arr.0.value': -0.42,
            },
          }
        )

        expect(
          await store.findOne('values', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 1,
          obj: {
            value: 1,
          },
          arr: [
            {
              value: 1,
            },
          ],
        })

        await adapter.unsubscribe(store, readModelName, async () => null)

        await adapter.disconnect(store)
      })

      test('operator "$set"', async () => {
        const readModelName = 'readModelName'

        const store = await adapter.connect(readModelName)
        await adapter.subscribe(
          store,
          readModelName,
          null,
          null,
          async () => null
        )

        await store.defineTable('SetValues', {
          indexes: {
            id: 'string',
          },
          fields: ['value', 'arr', 'obj'],
        })

        await store.insert('SetValues', {
          id: 'id-1',
          value: 1,
          arr: [{ value: 1 }],
          obj: { value: 1 },
        })

        expect(
          await store.findOne('SetValues', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 1,
          arr: [{ value: 1 }],
          obj: { value: 1 },
        })

        await store.update(
          'SetValues',
          {
            id: 'id-1',
          },
          {
            $set: {
              value: 2,
              'obj.value': 2,
              'arr.0.value': 2,
            },
          }
        )

        expect(
          await store.findOne('SetValues', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 2,
          arr: [{ value: 2 }],
          obj: { value: 2 },
        })

        await store.update(
          'SetValues',
          {
            id: 'id-1',
          },
          {
            $set: {
              value: null,
              'obj.value': null,
              'arr.0.value': null,
            },
          }
        )

        expect(
          await store.findOne('SetValues', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: null,
          arr: [{ value: null }],
          obj: { value: null },
        })

        await adapter.unsubscribe(store, readModelName, async () => null)

        await adapter.disconnect(store)
      })

      test('operator "$unset"', async () => {
        const readModelName = 'readModelName'

        const store = await adapter.connect(readModelName)
        await adapter.subscribe(
          store,
          readModelName,
          null,
          null,
          async () => null
        )

        await store.defineTable('UnsetValues', {
          indexes: {
            id: 'string',
          },
          fields: ['value', 'arr', 'obj'],
        })

        await store.insert('UnsetValues', {
          id: 'id-1',
          value: 1,
          arr: [{ value: 1 }],
          obj: { value: 1 },
        })

        expect(
          await store.findOne('UnsetValues', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: 1,
          arr: [{ value: 1 }],
          obj: { value: 1 },
        })

        await store.update(
          'UnsetValues',
          {
            id: 'id-1',
          },
          {
            $unset: {
              value: true,
              'obj.value': true,
              'arr.0.value': true,
            },
          }
        )

        expect(
          await store.findOne('UnsetValues', {
            id: 'id-1',
          })
        ).toMatchObject({
          value: null,
          arr: [{}],
          obj: {},
        })

        await adapter.unsubscribe(store, readModelName, async () => null)

        await adapter.disconnect(store)
      })
    })
  }
})
