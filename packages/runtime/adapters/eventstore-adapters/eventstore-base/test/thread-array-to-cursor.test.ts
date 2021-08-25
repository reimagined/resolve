import { AssertionError } from 'assert'
import {
  threadArrayToCursor,
  cursorToThreadArray,
  initThreadArray,
} from '../src'

describe('calculating cursor from array of thread counters', () => {
  test('should throw AssertionError when array has an invalid size', () => {
    const arr = new Array<number>(10)
    expect(() => threadArrayToCursor(arr)).toThrow(AssertionError)
  })

  test('should return expected results', () => {
    const arr = initThreadArray()
    arr[0] = 1
    arr[1] = 61
    arr[2] = 64
    arr[3] = 64 ** 7
    arr[4] = 26
    arr[5] = 62
    arr[6] = 63
    arr[255] = 2

    const cursor = threadArrayToCursor(arr)
    expect(cursor.substring(0, 8)).toEqual('AAAAAAAB')
    expect(cursor.substring(8, 8 * 2)).toEqual('AAAAAAA9')
    expect(cursor.substring(8 * 2, 8 * 3)).toEqual('AAAAAABA')
    expect(cursor.substring(8 * 3, 8 * 4)).toEqual('BAAAAAAA')
    expect(cursor.substring(8 * 4, 8 * 5)).toEqual('AAAAAAAa')
    expect(cursor.substring(8 * 5, 8 * 6)).toEqual('AAAAAAA+')
    expect(cursor.substring(8 * 6, 8 * 7)).toEqual('AAAAAAA/')
    expect(cursor.substring(8 * 7, 8 * 8)).toEqual('AAAAAAAA')
    expect(cursor.substring(8 * 255, 8 * 256)).toEqual('AAAAAAAC')

    const translatedArr = cursorToThreadArray(cursor)
    expect(translatedArr).toEqual(arr)
  })

  test.skip('Test performance', () => {
    const arr: Array<Array<number>> = []
    for (let i = 0; i < 100000; ++i) {
      const threadArray = initThreadArray()
      for (let j = 0; j < threadArray.length; ++j) {
        threadArray[j] = j
      }
      arr.push(threadArray)
    }

    for (let i = 0; i < arr.length; ++i) {
      threadArrayToCursor(arr[i])
    }
  })
})
