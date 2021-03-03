import { IS_BUILT_IN } from '@resolve-js/core'
import serialize from '../../src/common/defaults/json-serialize-state'

test('should have IS_BUILT_IN field set', () => {
  expect(serialize[IS_BUILT_IN]).toEqual(true)
})
