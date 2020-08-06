import sinon from 'sinon'

import * as validate from '../src/validate'

describe('validate.string', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should be works correctly', () => {
    const result = validate.string('value', 'name')

    expect(result).toBeUndefined()
  })

  test('should be fail', () => {
    expect(() => validate.string(1, 'name')).toThrow()

    expect(() => validate.string([], 'name')).toThrow()

    expect(() => validate.string({}, 'name')).toThrow()
  })
})

describe('validate.leadingSlash', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should be works correctly', () => {
    const result = validate.leadingSlash('/value', 'name')

    expect(result).toBeUndefined()
  })

  test('should be fail', () => {
    expect(() => validate.leadingSlash('value', 'name')).toThrow()

    expect(() => validate.leadingSlash('value/', 'name')).toThrow()
  })
})

describe('validate.arrayOfString', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should be works correctly', () => {
    const result = validate.arrayOfString(['a', 'b', 'c'], 'name')

    expect(result).toBeUndefined()
  })

  test('should be fail', () => {
    expect(() => validate.arrayOfString([1, 'b', 'c'], 'name')).toThrow()

    expect(() => validate.arrayOfString(['a', 1, 'c'], 'name')).toThrow()

    expect(() => validate.arrayOfString(['a', 'b', 1], 'name')).toThrow()
  })
})
