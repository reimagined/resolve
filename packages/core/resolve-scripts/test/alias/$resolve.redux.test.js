import path from 'path'
import alias from '../../src/alias/$resolve.redux'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    redux: {
      reducers: {
        testReducerName: path.resolve(__dirname, 'files/testReducer.js')
      },
      middlewares: [path.resolve(__dirname, 'files/testMiddleware.js')],
      sagas: [path.resolve(__dirname, 'files/testSaga.js')],
      enhancers: [path.resolve(__dirname, 'files/testEnhancer.js')]
    }
  }

  test('[client]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})

describe('base config should fail', () => {
  let resolveConfig = null
  beforeEach(() => {
    resolveConfig = {
      redux: {
        reducers: {
          testReducerName: path.resolve(__dirname, 'files/testReducer.js')
        },
        middlewares: [path.resolve(__dirname, 'files/testMiddleware.js')],
        sagas: [path.resolve(__dirname, 'files/testSaga.js')],
        enhancers: [path.resolve(__dirname, 'files/testEnhancer.js')]
      }
    }
  })

  afterEach(() => {
    resolveConfig = null
  })

  test('on wrong reducers', () => {
    resolveConfig.redux.reducers = null
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('on wrong middlewares', () => {
    resolveConfig.redux.middlewares = null
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('on wrong sagas', () => {
    resolveConfig.redux.sagas = null
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('on wrong enhancers', () => {
    resolveConfig.redux.enhancers = null
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })
})

describe('base config should bypass', () => {
  let resolveConfig = null
  beforeEach(() => {
    resolveConfig = {
      redux: {
        reducers: {
          testReducerName: path.resolve(__dirname, 'files/testReducer.js')
        },
        middlewares: [path.resolve(__dirname, 'files/testMiddleware.js')],
        sagas: [path.resolve(__dirname, 'files/testSaga.js')],
        enhancers: [path.resolve(__dirname, 'files/testEnhancer.js')]
      }
    }
  })

  afterEach(() => {
    resolveConfig = null
  })

  test('on absent reducers', () => {
    delete resolveConfig.redux.reducers
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })

  test('on absent middlewares', () => {
    delete resolveConfig.redux.middlewares
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })

  test('on absent sagas', () => {
    delete resolveConfig.redux.sagas
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })

  test('on absent enhancers', () => {
    delete resolveConfig.redux.enhancers
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})
