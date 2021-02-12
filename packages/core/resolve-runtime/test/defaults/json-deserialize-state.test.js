import { IS_BUILT_IN } from '@reimagined/core'
import deserialize from '../../src/common/defaults/json-deserialize-state'

test('should have IS_BUILT_IN field set', () => {
  expect(deserialize[IS_BUILT_IN]).toEqual(true)
})
