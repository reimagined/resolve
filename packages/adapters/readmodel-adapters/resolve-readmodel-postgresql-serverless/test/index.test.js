import { result } from 'aws-sdk/clients/rdsdataservice'
import createReadModelAdapter from '../src'

describe('resolve-readmodel-postgresql-serverless', () => {
  let adapter = null

  beforeEach(() => {
    adapter = createReadModelAdapter({
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      awsSecretStoreArn: 'awsSecretStoreArn',
      databaseName: 'databaseName',
      tablePrefix: 'tablePrefix'
    })
  })

  afterEach(() => {
    result.length = 0
  })

  test('methods "defineTable", "insert", "update", "count", "delete"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)

    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string'
      },
      fields: ['createdAt', 'name']
    })

    await store.insert('ShoppingLists', {
      id: 'id-1',
      name: 'Products',
      createdAt: 1
    })

    await store.insert('ShoppingLists', {
      id: 'id-2',
      name: 'Medicines',
      createdAt: 2
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
      id: 'id-2'
    })

    await store.update(
      'ShoppingLists',
      { id: 'id-3' },
      { $set: { name: 'Entries' } },
      { upsert: true }
    )

    await store.count('ShoppingLists', {})

    expect(result).toMatchSnapshot()
  })

  test('methods "defineTable", "insert", "find", "findOne"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)

    await store.defineTable('Entries', {
      indexes: {
        id: 'string'
      },
      fields: ['name']
    })

    await store.insert('Entries', {
      id: 'id-1',
      name: 'First entry'
    })

    await store.insert('Entries', {
      id: 'id-2',
      name: 'Second entry'
    })

    await store.insert('Entries', {
      id: 'id-3',
      name: 'Second entry'
    })

    await store.insert('Entries', {
      id: 'id-4',
      name: 'First entry'
    })

    await store.insert('Entries', {
      id: 'id-5',
      name: 'Second entry'
    })

    await store.find('Entries', {}, {}, { id: 1 })

    await store.find('Entries', {}, {}, { id: -1 })

    await store.findOne('Entries', { id: 'id-3' })

    await store.find('Entries', {
      $or: [
        { $and: [{ name: 'Second entry', id: 'id-2' }] },
        { $not: { id: { $gte: 'id-1' } } }
      ]
    })

    expect(result).toMatchSnapshot()
  })

  test('method "drop"', async () => {
    const readModelName1 = 'readModelName1'
    const readModelName2 = 'readModelName2'

    const store1 = await adapter.connect(readModelName1)
    const store2 = await adapter.connect(readModelName2)

    await store1.defineTable('table1', {
      indexes: {
        id: 'string'
      },
      fields: ['test']
    })

    await store1.insert('table1', {
      id: 'id-1',
      test: true
    })

    await store1.insert('table1', {
      id: 'id-2',
      test: true
    })

    await store2.defineTable('table2', {
      indexes: {
        id: 'string'
      },
      fields: ['test']
    })

    await store2.insert('table2', {
      id: 'id-3',
      test: true
    })

    await store2.insert('table2', {
      id: 'id-4',
      test: true
    })

    await store2.insert('table2', {
      id: 'id-5',
      test: true
    })

    await store1.count('table1', {})

    await store2.count('table2', {})

    await adapter.drop(store1, readModelName1)
    await adapter.drop(store2, readModelName2)

    expect(result).toMatchSnapshot()
  })

  test('operator "$inc"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)

    await store.defineTable('values', {
      indexes: {
        id: 'string'
      },
      fields: ['value', 'arr', 'obj']
    })

    await store.insert('values', {
      id: 'id-1',
      value: 1,
      obj: {
        value: 1
      },
      arr: [
        {
          value: 1
        }
      ]
    })

    await store.update(
      'values',
      {
        id: 'id-1'
      },
      {
        $inc: {
          value: 1,
          'obj.value': 1,
          'arr.0.value': 1
        }
      }
    )

    await store.update(
      'values',
      {
        id: 'id-1'
      },
      {
        $inc: {
          value: -1,
          'obj.value': -1,
          'arr.0.value': -1
        }
      }
    )

    await store.update(
      'values',
      {
        id: 'id-1'
      },
      {
        $inc: {
          value: 0.42,
          'obj.value': 0.42,
          'arr.0.value': 0.42
        }
      }
    )

    await store.update(
      'values',
      {
        id: 'id-1'
      },
      {
        $inc: {
          value: -0.42,
          'obj.value': -0.42,
          'arr.0.value': -0.42
        }
      }
    )

    expect(result).toMatchSnapshot()
  })

  test('operator "$set"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)

    await store.defineTable('values', {
      indexes: {
        id: 'string'
      },
      fields: ['value', 'arr', 'obj']
    })

    await store.insert('values', {
      id: 'id-1',
      value: 1,
      arr: [{ value: 1 }],
      obj: { value: 1 }
    })

    await store.update(
      'values',
      {
        id: 'id-1'
      },
      {
        $set: {
          value: 2,
          'obj.value': 2,
          'arr.0.value': 2
        }
      }
    )

    expect(result).toMatchSnapshot()
  })

  test('operator "$unset"', async () => {
    const readModelName = 'readModelName'

    const store = await adapter.connect(readModelName)

    await store.defineTable('values', {
      indexes: {
        id: 'string'
      },
      fields: ['value', 'arr', 'obj']
    })

    await store.insert('values', {
      id: 'id-1',
      value: 1,
      arr: [{ value: 1 }],
      obj: { value: 1 }
    })

    await store.update(
      'values',
      {
        id: 'id-1'
      },
      {
        $unset: {
          value: '',
          'obj.value': '',
          'arr.0.value': ''
        }
      }
    )

    expect(result).toMatchSnapshot()
  })
})
