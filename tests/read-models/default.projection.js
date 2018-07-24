const projection = {
  Init: async store => {
    await store.defineTable('TestTable', {
      indexes: {
        firstIndexName: 'number',
        secondIndexName: 'string'
      },
      fields: ['firstFieldName', 'secondFieldName', 'firstJsonName', 'secondJsonName']
    })
  },

  INSERT_TEST: async (store, event) => {
    await store.insert('TestTable', {
      firstIndexName: 1,
      secondIndexName: 'idx-a',
      firstFieldName: 'content',
      secondFieldName: 0,
      firstJsonName: { a: 1, b: 2, e: 10 },
      secondJsonName: [1, 2, 3]
    })

    await store.insert('TestTable', {
      firstIndexName: 2,
      secondIndexName: 'idx-a',
      secondFieldName: 100,
      firstJsonName: { c: 3, d: 4, e: 20 }
    })

    await store.insert('TestTable', {
      firstIndexName: 3,
      secondIndexName: 'idx-b',
      secondFieldName: 200,
      secondJsonName: [3, 2, 1]
    })

    await store.insert('TestTable', {
      firstIndexName: 4,
      firstFieldName: 'text'
    })
  },

  UPDATE_TEST: async (store, event) => {
    await store.update(
      'TestTable',
      {
        firstIndexName: { $gt: 1 },
        secondIndexName: { $eq: 'idx-a' }
      },
      {
        $set: {
          'firstJsonName.f': 'new-inner-field',
          thirdFieldName: 'new-outer-field',
          thirdJsonName: ['new', 'outer', 'json', 'value']
        },
        $unset: {
          'firstJsonName.d': true,
          secondJsonName: true
        },
        $inc: {
          'firstJsonName.e': 5,
          secondFieldName: 42
        }
      }
    )

    await store.update(
      'TestTable',
      {
        $or: [
          {
            $and: [{ firstIndexName: { $lt: 1 } }, { secondIndexName: { $eq: 'idx-a' } }]
          },
          { secondIndexName: 'idx-b' }
        ]
      },
      {
        $set: {
          'firstJsonName.f': 'new-inner-field',
          thirdFieldName: 'new-outer-field',
          thirdJsonName: ['new', 'outer', 'json', 'value']
        }
      }
    )
  },

  UPSERT_TEST: async (store, event) => {
    await store.update(
      'TestTable',
      { firstIndexName: 10 },
      {
        $set: {
          'firstJsonName.f': 'new-inner-field',
          thirdFieldName: 'new-outer-field',
          thirdJsonName: ['new', 'outer', 'json', 'value']
        },
        $unset: {
          thirdFieldName: true
        }
      },
      { upsert: true }
    )
  },

  DELETE_TEST: async (store, event) => {}

}

export default projection
