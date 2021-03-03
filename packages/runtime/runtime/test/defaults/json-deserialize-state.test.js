import { IS_BUILT_IN } from '@resolve-js/core'
import deserialize from '../../src/common/defaults/json-deserialize-state'

test('should have IS_BUILT_IN field set', () => {
  expect(deserialize[IS_BUILT_IN]).toEqual(true)
})
