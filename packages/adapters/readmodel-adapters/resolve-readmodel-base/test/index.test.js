import createReadModelConnector from '../src/index'

describe('resolve-readmodel-base', () => {
  let connector, dropSet, readModels

  beforeEach(() => {
    readModels = new Map()
    dropSet = new Set()

    const connect = jest.fn().mockImplementation(async pool => {
      Object.defineProperty(pool, 'readModels', {
        get: () => readModels,
        configurable: true
      })
      Object.defineProperty(pool, 'dropSet', {
        get: () => dropSet,
        configurable: true
      })
    })

    const disconnect = jest.fn().mockImplementation(async pool => {
      if (pool != null) {
        delete pool.readModels
        delete pool.dropSet
      }
    })

    const dropReadModel = jest
      .fn()
      .mockImplementation(async (pool, readModelName) => {
        pool.dropSet.add(readModelName)
        pool.readModels.delete(readModelName)
      })

    const storeApi = {
      get(pool, readModelName, key) {
        if (!pool.readModels.has(readModelName)) {
          pool.readModels.set(readModelName, new Map())
        }
        return pool.readModels.get(readModelName).get(key)
      },
      set(pool, readModelName, key, value) {
        if (!pool.readModels.has(readModelName)) {
          pool.readModels.set(readModelName, new Map())
        }
        pool.readModels.get(readModelName).set(key, value)
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
