import { isMatchEventType } from '../src/event-broadcast-factory'

describe('method "isMatchEventType"', () => {
  test('should return true when eventTypes includes eventType', () => {
    expect(
      isMatchEventType(
        ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'ITEM_CREATE'
      )
    ).toEqual(true)
    expect(
      isMatchEventType(
        ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'ITEM_UPDATED'
      )
    ).toEqual(true)
    expect(
      isMatchEventType(
        ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'ITEM_DELETED'
      )
    ).toEqual(true)
  })

  test('should return false when eventTypes not includes eventType', () => {
    expect(
      isMatchEventType(
        ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'NOT_MATCHED_TYPE'
      )
    ).toEqual(false)
  })
})
