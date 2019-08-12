describe('resolve-zeromq', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })
  test('should export zeromq when node js unknown version', () => {
    jest.mock('zeromq', () => {
      throw new Error('Cannot find module "zeromq"')
    })
    jest.mock('zeromq-ng/compat', () => {
      throw new Error('Cannot find module "zeromq-ng"')
    })

    expect(() => {
      require('../src').socket()
    }).toThrow()
  })

  test('should export zeromq when node js version 8.10.0', () => {
    jest.mock('zeromq', () => {
      return {}
    })
    jest.mock('zeromq-ng/compat', () => {
      throw new Error('Cannot find module "zeromq-ng"')
    })

    require('../src')
  })

  test('should export zeromq when node js version 12.8.0', () => {
    jest.mock('zeromq', () => {
      throw new Error('Cannot find module "zeromq"')
    })
    jest.mock('zeromq-ng/compat', () => {
      return {}
    })

    require('../src')
  })
})
