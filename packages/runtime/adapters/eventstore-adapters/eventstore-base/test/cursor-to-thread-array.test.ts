import { AssertionError } from 'assert'
import {
  cursorToThreadArray,
  threadArrayToCursor,
  THREAD_COUNT,
  initThreadArray,
} from '../src'

describe('calculating array of threadCounters from cursor', () => {
  test('should throw AssertionError when cursor has an invalid size', () => {
    expect(() => cursorToThreadArray('AAAAAAAAAAAAAAAA')).toThrow(
      AssertionError
    )
  })

  test('should return all zero array from null cursor', () => {
    const arr = cursorToThreadArray(null)
    expect(arr).toEqual(initThreadArray())
  })

  test('should return all zero array from initial cursor', () => {
    const cursor = 'AAAAAAAA'.repeat(THREAD_COUNT)
    const arr = cursorToThreadArray(cursor)
    expect(arr).toEqual(initThreadArray())
  })

  test('should return expected results', () => {
    const cursor =
      // eslint-disable-next-line no-useless-concat
      'AAAAAAAB' + 'AAAAAAAa' + 'AAAAAAAA'.repeat(THREAD_COUNT - 3) + 'BAAAAAAA'
    const arr = cursorToThreadArray(cursor)
    const expectedArr = initThreadArray()
    expectedArr[0] = 1
    expectedArr[1] = 26
    expectedArr[255] = 64 ** 7
    expect(arr).toEqual(expectedArr)
    expect(cursor).toEqual(threadArrayToCursor(arr))
  })

  test.skip('Test performance', () => {
    const arr: Array<string> = []
    for (let i = 0; i < 100000; ++i) {
      const cursor = 'ABCDEFGH'.repeat(THREAD_COUNT)
      arr.push(cursor)
    }

    for (let i = 0; i < arr.length; ++i) {
      cursorToThreadArray(arr[i])
    }
  })
})
