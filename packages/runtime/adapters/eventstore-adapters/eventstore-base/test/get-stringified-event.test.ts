import { getStringifiedEvent } from '../src/import-events'

test('getStringifiedEvent should work correctly', () => {
  const event = { item: 'アニメの女の子' }
  const stringifiedEvent = JSON.stringify(event)
  const buffer = Buffer.from(stringifiedEvent)
  const bufferSize = buffer.length

  expect(
    getStringifiedEvent({
      buffer,
      bufferSize,
      beginPosition: 0,
      endPosition: bufferSize,
      encoding: 'utf8',
    }).stringifiedEvent
  ).toEqual(stringifiedEvent)

  const halfPosition = Math.floor(bufferSize / 2)
  expect(
    getStringifiedEvent({
      buffer: Buffer.concat([
        buffer.slice(halfPosition, bufferSize),
        buffer.slice(0, halfPosition),
      ]),
      bufferSize,
      beginPosition: halfPosition,
      endPosition: halfPosition,
      encoding: 'utf8',
    }).stringifiedEvent
  ).toEqual(stringifiedEvent)
})
