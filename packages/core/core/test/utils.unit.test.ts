import { lateBoundProxy } from '../src/utils'

describe('lateBoundProxy', () => {
  test('late binding works', () => {
    const original = jest.fn()
    const late = jest.fn()
    const source = {
      lateBound: {
        hello: original,
      },
    }

    const proxy = lateBoundProxy(source, 'lateBound')
    proxy.hello()

    expect(original).toHaveBeenCalled()
    original.mockClear()

    source.lateBound = {
      hello: late,
    }
    proxy.hello()

    expect(original).not.toHaveBeenCalled()
    expect(late).toHaveBeenCalled()
  })

  test('late binding works for getter', () => {
    const original = jest.fn()
    const late = jest.fn()
    let target = {
      hello: original,
    }
    const source = Object.create(Object.prototype, {
      lateBound: {
        get: () => {
          return target
        },
      },
    })

    const proxy = lateBoundProxy(source, 'lateBound')
    proxy.hello()

    expect(original).toHaveBeenCalled()
    original.mockClear()

    target = {
      hello: late,
    }
    proxy.hello()

    expect(original).not.toHaveBeenCalled()
    expect(late).toHaveBeenCalled()
  })
})
