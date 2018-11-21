import declareRuntimeEnv from '../../src/declare_runtime_env'
import alias from '../../src/alias/$resolve.customConstants'

describe('base config works correctly', () => {
  const resolveConfig = {
    customConstants: {
      AAA: 'AaA',
      BBB: 123,
      CCC: true,
      DDD: {
        a: 5,
        b: 10,
        c: 20
      }
    }
  }

  test('[client]', () => {
    expect(
      alias({
        resolveConfig,
        isClient: true
      }).code
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      alias({
        resolveConfig,
        isClient: false
      }).code
    ).toMatchSnapshot()
  })
})

describe('config with process.env failure', () => {
  const resolveConfig = {
    customConstants: {
      AAA: declareRuntimeEnv('AAA')
    }
  }

  test('[client]', () => {
    expect(
      () =>
        alias({
          resolveConfig,
          isClient: true
        }).code
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      () =>
        alias({
          resolveConfig,
          isClient: false
        }).code
    ).toMatchSnapshot()
  })
})

describe('config with deep process.env failure', () => {
  const resolveConfig = {
    customConstants: {
      obj: {
        AAA: declareRuntimeEnv('AAA')
      }
    }
  }

  test('[client]', () => {
    expect(
      () =>
        alias({
          resolveConfig,
          isClient: true
        }).code
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      () =>
        alias({
          resolveConfig,
          isClient: false
        }).code
    ).toMatchSnapshot()
  })
})

describe('config with non-json type failure', () => {
  const resolveConfig = {
    customConstants: {
      obj: {
        func: () => {}
      }
    }
  }

  test('[client]', () => {
    expect(
      () =>
        alias({
          resolveConfig,
          isClient: true
        }).code
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      () =>
        alias({
          resolveConfig,
          isClient: false
        }).code
    ).toThrow()
  })
})
