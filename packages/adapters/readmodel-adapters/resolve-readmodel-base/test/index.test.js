import createReadModelConnector from '../src/index'

describe('resolve-readmodel-base', () => {
  let connector, dropSet, readModels

  beforeEach(() => {
    dropSet = new Set()

    const connect = jest.fn().mockImplementation(async () => {
      readModels = new Map()
    })

    const disconnect = jest.fn()

    const dropReadModel = jest
      .fn()
      .mockImplementation(async (_, readModelName) => {
        dropSet.add(readModelName)
        readModels.delete(readModelName)
      })

    const storeApi = {
      get(pool, readModelName, key) {
        if (!readModels.has(readModelName)) {
          readModels.set(readModelName, new Map())
        }
        return readModels.get(readModelName).get(key)
      },
      set(pool, readModelName, key, value) {
        if (!readModels.has(readModelName)) {
          readModels.set(readModelName, new Map())
        }
        readModels.get(readModelName).set(key, value)
      }
    }

    connector = createReadModelConnector(
      {
        connect,
        disconnect,
        dropReadModel,
        ...storeApi
      },
      {}
    )
  })

  afterEach(async () => {
    await connector.dispose()
    connector = null
    readModels = null
    dropSet = null
  })

  test('"connect" should return a store', async () => {
    const storeAnimals = await connector.connect('animals')
    storeAnimals.set('cat', 42)
    storeAnimals.set('dog', 31)

    const storeProducts = await connector.connect('products')
    storeProducts.set('milk', 10)
    storeProducts.set('bread', 20)

    expect(readModels.size).toEqual(2)

    expect(storeAnimals).toEqual(storeProducts)

    expect(dropSet.size).toEqual(0)

    expect(storeAnimals.get).toBeInstanceOf(Function)
    expect(storeAnimals.set).toBeInstanceOf(Function)

    expect(storeProducts.get).toBeInstanceOf(Function)
    expect(storeProducts.set).toBeInstanceOf(Function)
  })

  test('"disconnect" should disconnect the store', async () => {
    const storeAnimals = await connector.connect('animals')
    storeAnimals.set('cat', 42)
    storeAnimals.set('dog', 31)

    const storeProducts = await connector.connect('products')
    storeProducts.set('milk', 10)
    storeProducts.set('bread', 20)

    expect(readModels.size).toEqual(2)

    expect(storeAnimals).toEqual(storeProducts)

    expect(dropSet.size).toEqual(0)

    await connector.disconnect(storeAnimals, 'animals')

    expect(dropSet.size).toEqual(0)

    expect(readModels.size).toEqual(2)

    await connector.disconnect(storeProducts, 'products')

    expect(dropSet.size).toEqual(0)

    expect(readModels.size).toEqual(2)

    await connector.disconnect(storeProducts, 'products')

    expect(dropSet.size).toEqual(0)

    expect(readModels.size).toEqual(2)
  })

  test('"drop" should drop the read model', async () => {
    const storeAnimals = await connector.connect('animals')
    storeAnimals.set('cat', 42)
    storeAnimals.set('dog', 31)

    const storeProducts = await connector.connect('products')
    storeProducts.set('milk', 10)
    storeProducts.set('bread', 20)

    expect(readModels.size).toEqual(2)

    expect(storeAnimals).toEqual(storeProducts)

    expect(dropSet.size).toEqual(0)

    await connector.drop(storeAnimals, 'animals')

    expect(dropSet.size).toEqual(1)

    expect(readModels.size).toEqual(1)

    await connector.drop(storeProducts, 'products')

    expect(dropSet.size).toEqual(2)

    expect(readModels.size).toEqual(0)

    await connector.drop(storeProducts, 'products')

    expect(dropSet.size).toEqual(2)

    expect(readModels.size).toEqual(0)
  })
})
