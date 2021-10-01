//eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { result } from 'pg'
import createReadModelAdapter from '../src'

describe('@resolve-js/readmodel-postgresql', () => {
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let adapter = null! as ReturnType<typeof createReadModelAdapter>

  beforeEach(() => {
    adapter = createReadModelAdapter({
      databaseName: 'databaseName',
      tablePrefix: 'tablePrefix',
    })
  })

  afterEach(() => {
    result.length = 0
  })

  test('methods "defineTable", "insert", "update", "count", "delete"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)
    await adapter.subscribe(store, readModelName, null, null)

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

    await store.count('ShoppingLists', {})

    await adapter.unsubscribe(store, readModelName)
    await adapter.disconnect(store)

    expect(result).toMatchSnapshot()
  })

  test('methods "defineTable", "insert", "find", "findOne"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)
    await adapter.subscribe(store, readModelName, null, null)

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

    await store.find('Entries', {}, {}, { id: 1 })

    await store.find('Entries', {}, {}, { id: -1 })

    await store.findOne('Entries', { id: 'id-3' })

    await store.find('Entries', {
      $or: [
        { $and: [{ name: 'Second entry', id: 'id-2' }] },
        { $not: { id: { $gte: 'id-1' } } },
      ],
    })

    await adapter.unsubscribe(store, readModelName)
    await adapter.disconnect(store)

    expect(result).toMatchSnapshot()
  })

  test('method "drop"', async () => {
    const readModelName1 = 'readModelName1'
    const readModelName2 = 'readModelName2'

    const store1 = await adapter.connect(readModelName1)
    const store2 = await adapter.connect(readModelName2)
    await adapter.subscribe(store1, readModelName1, null, null)
    await adapter.subscribe(store2, readModelName2, null, null)

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

    await store1.count('table1', {})

    await store2.count('table2', {})

    await adapter.unsubscribe(store1, readModelName1)
    await adapter.unsubscribe(store2, readModelName2)

    await adapter.disconnect(store1)
    await adapter.disconnect(store2)

    expect(result).toMatchSnapshot()
  })

  test('operator "$inc"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)
    await adapter.subscribe(store, readModelName, null, null)

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

    await adapter.unsubscribe(store, readModelName)
    await adapter.disconnect(store)

    expect(result).toMatchSnapshot()
  })

  test('operator "$set"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)
    await adapter.subscribe(store, readModelName, null, null)

    await store.defineTable('values', {
      indexes: {
        id: 'string',
      },
      fields: ['value', 'arr', 'obj'],
    })

    await store.insert('values', {
      id: 'id-1',
      value: 1,
      arr: [{ value: 1 }],
      obj: { value: 1 },
    })

    await store.update(
      'values',
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

    await store.update(
      'values',
      {
        id: 'id-1',
      },
      {
        $set: {
          'obj.a': null,
          'obj.b': null,
          a: null,
          b: null,
        },
      }
    )

    await adapter.unsubscribe(store, readModelName)
    await adapter.disconnect(store)

    expect(result).toMatchSnapshot()
  })

  test('operator "$unset"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)
    await adapter.subscribe(store, readModelName, null, null)

    await store.defineTable('values', {
      indexes: {
        id: 'string',
      },
      fields: ['value', 'arr', 'obj'],
    })

    await store.insert('values', {
      id: 'id-1',
      value: 1,
      arr: [{ value: 1 }],
      obj: { value: 1 },
    })

    await store.update(
      'values',
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

    await adapter.unsubscribe(store, readModelName)
    await adapter.disconnect(store)

    expect(result).toMatchSnapshot()
  })
})
