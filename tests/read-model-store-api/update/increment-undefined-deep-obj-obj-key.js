const testId = 'root'

const projection = {
  Init: async (store) => {
    await store.defineTable('test', {
      indexes: { testId: 'string' },
      fields: ['key', 'obj', 'deepObj'],
    })

    // await store.insert('test', {
    //   testId,
    //   key: undefined,
    //   obj: {
    //     key: undefined,
    //   },
    //   deepObj: {
    //     obj: {
    //       key: undefined,
    //     },
    //   },
    // })
  },

  TEST: async (store, event) => {
    const { aggregateId: testId } = event

    // await store.update(
    //   'test',
    //   {
    //     testId,
    //   },
    //   {
    //     $inc: {
    //       [`deepObj.obj.key`]: 1,
    //     },
    //   }
    // )
  },
}

export default projection
