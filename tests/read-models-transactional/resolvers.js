const resolvers = {
  IS_FINISHED: async store => {
    const count = await store.count('FinishTable', {})

    return count > 0
  },
  IS_SUCCESS: async store => {
    const findResult = await store.find('CountTable', {}, null, { value: 1 })

    const set = new Set()

    for (let index = 0; index < findResult.length - 1; index++) {
      set.add(findResult[index].value)
      if (findResult[index].timestamp > findResult[index + 1].timestamp) {
        throw new Error('Wrong timestamp')
      }
    }

    set.add(findResult[findResult.length - 1].value)

    if (findResult.length !== set.size) {
      throw new Error('Wrong length')
    }

    return 'ok'
  }
}

module.exports = resolvers
