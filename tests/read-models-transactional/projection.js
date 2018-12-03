const uuid = require('uuid/v4')

const projection = {
  Init: async store => {
    await store.defineTable('CountTable', {
      indexes: {
        key: 'string',
        value: 'number'
      },
      fields: ['timestamp']
    })
    await store.defineTable('FinishTable', {
      indexes: { key: 'string' },
      fields: []
    })
    await store.defineTable('LengthTable', {
      indexes: { key: 'string' },
      fields: ['value']
    })
  },

  COUNT_EVENT: async (store, event) => {
    const count = (
      (await store.findOne('LengthTable', {
        key: 'LEN'
      })) || { value: 0 }
    ).value

    await store.insert('CountTable', {
      key: uuid(),
      value: count + 0,
      timestamp: event.timestamp
    })

    await store.insert('CountTable', {
      key: uuid(),
      value: count + 1,
      timestamp: event.timestamp
    })

    await store.insert('CountTable', {
      key: uuid(),
      value: count + 2,
      timestamp: event.timestamp
    })

    await store.update(
      'LengthTable',
      { key: 'LEN' },
      { $set: { value: count + 3 } },
      { upsert: true }
    )
  },

  FINISH_EVENT: async store => {
    await store.insert('FinishTable', {
      key: 'finished'
    })
  }
}

module.exports = projection
