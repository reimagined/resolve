import assert from 'assert'

const threadArrayToCursor = (threadArray: Array<number>): string => {
  const cursorBuffer: Buffer = Buffer.alloc(256 * 6)

  assert.strictEqual(
    threadArray.length,
    256,
    'Cursor must be represented by array of 256 numbers'
  )

  for (let i = 0; i < threadArray.length; ++i) {
    const threadCounter: number = threadArray[i]
    const threadCounterHex: string = threadCounter
      .toString(16)
      .padStart(12, '0')

    assert.strictEqual(
      threadCounterHex.length,
      12,
      'threadCounter in hex form must have length equal to 12'
    )

    for (
      let hexIndex = 0, hexPairIndex = 0;
      hexIndex < threadCounterHex.length;
      hexIndex += 2, hexPairIndex++
    ) {
      cursorBuffer[i * 6 + hexPairIndex] = Buffer.from(
        threadCounterHex.substring(hexIndex, hexIndex + 2),
        'hex'
      )[0]
    }
  }

  return cursorBuffer.toString('base64')
}

export default threadArrayToCursor
