import { a } from '../src/index'
import { f3 } from '../src/b/index'

test('test', () => {
  const sum: number = a.f1(1, 2)

  expect(sum).toEqual(3)
  expect(f3(false, false)).toEqual(false)
  expect(f3(false, true)).toEqual(false)
  expect(f3(true, false)).toEqual(false)
  expect(f3(true, true)).toEqual(true)
})
