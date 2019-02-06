const projection = {
  Init: async store => {
    await store.defineTable('TestTable', {
      indexes: {
        firstIndexName: 'number',
        secondIndexName: 'string'
      },
      fields: [
        'firstFieldName',
        'secondFieldName',
        'firstJsonName',
        'secondJsonName'
      ]
    })
  },

  INSERT_TEST: async (store, event) => {
    const testEventContent = event.payload

    await store.insert('TestTable', {
      firstIndexName: 1,
      secondIndexName: 'idx-a',
      firstFieldName: testEventContent,
      secondFieldName: 0,
      firstJsonName: { a: 1, b: 2, e: 10 },
      secondJsonName: [1, 2, 3]
    })

    await store.insert('TestTable', {
      firstIndexName: 2,
      secondIndexName: 'idx-a',
      firstFieldName: null,
      secondFieldName: 100,
      firstJsonName: { c: 3, d: 4, e: 20 },
      secondJsonName: null
    })

    await store.insert('TestTable', {
      firstIndexName: 3,
      secondIndexName: 'idx-b',
      firstFieldName: null,
      secondFieldName: 200,
      firstJsonName: null,
      secondJsonName: [3, 2, 1]
    })

    await store.insert('TestTable', {
      firstIndexName: 4,
      secondIndexName: null,
      firstFieldName: testEventContent,
      secondFieldName: null,
      firstJsonName: null,
      secondJsonName: null
    })
  },

  UPDATE_TEST: async (store, event) => {
    const testEventContent = event.payload

    await store.update(
      'TestTable',
      {
        firstIndexName: { $gt: 1 },
        secondIndexName: 'idx-a'
      },
      {
        $set: {
          'firstJsonName.f': 'inner-field',
          firstFieldName: 'outer-field',
          secondJsonName: ['outer', 'json', 'value', testEventContent]
        },
        $unset: {
          'firstJsonName.d': true
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
            $and: [{ firstIndexName: { $lt: 1 } }, { secondIndexName: 'idx-a' }]
          },
          { secondIndexName: 'idx-b' }
        ]
      },
      {
        $set: {
          firstFieldName: 'outer-field',
          secondJsonName: ['outer', 'json', 'value', testEventContent]
        }
      }
    )
  },

  UPSERT_TEST: async (store, event) => {
    const testEventContent = event.payload

    await store.update(
      'TestTable',
      { firstIndexName: 10 },
      {
        $set: {
          'firstJsonName.f': 'inner-field',
          firstFieldName: 'outer-field',
          secondJsonName: ['outer', 'json', 'value', testEventContent]
        }
      },
      { upsert: true }
    )
  },

  DELETE_TEST: async (store, event) => {
    const testEventContent = event.payload

    await store.delete('TestTable', {
      firstIndexName: { $gt: 1 },
      secondIndexName: 'idx-a'
    })

    await store.delete('TestTable', {
      $or: [
        {
          $and: [{ firstIndexName: { $lt: 1 } }, { secondIndexName: 'idx-a' }]
        },
        { secondIndexName: testEventContent }
      ]
    })
  }
}

export default projection
