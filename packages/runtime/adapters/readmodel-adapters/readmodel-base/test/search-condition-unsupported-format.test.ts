import { isConditionUnsupportedFormat } from '../src/wrap-is-condition-unsupported-format'
import type { SearchCondition } from '../src/types'

test('isConditionUnsupportedFormat should work correctly', () => {
  const items = [
    { $or: [{ a: true, b: true }] },
    { $and: [{ a: true, b: true }] },
    { $not: { a: true } },
    { $or: [{ a: true, b: true }], BAD: true },
    { $and: [{ a: true, b: true }], BAD: true },
    { $not: { a: true }, BAD: true },
    { c: { $or: [{ a: true, b: true }] } },
    { c: { $and: [{ a: true, b: true }] } },
    { c: { $not: { a: true } } },
    { c: { $or: [{ a: true, b: true }], BAD: true } },
    { c: { $and: [{ a: true, b: true }], BAD: true } },
    { c: { $not: { a: true }, BAD: true } },
  ] as Array<SearchCondition>

  expect(items.filter(isConditionUnsupportedFormat)).toEqual([
    { $or: [{ a: true, b: true }], BAD: true },
    { $and: [{ a: true, b: true }], BAD: true },
    { $not: { a: true }, BAD: true },
    { c: { $or: [{ a: true, b: true }], BAD: true } },
    { c: { $and: [{ a: true, b: true }], BAD: true } },
    { c: { $not: { a: true }, BAD: true } },
  ])
})
