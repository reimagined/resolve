import loadEventsByCursor from '../src/load-events-by-cursor'
import shapeEvent from '../src/shape-event'
import { AdapterPool } from '../src/types'

describe('method "loadEventsByCursor"', () => {
  test('should return correct cursor', async () => {
    const escapeId = (text: string) => text
    const escape = (text: string) => text

    const events = [
      {
        threadId: 0,
        threadCounter: 0,
        payload: '{}',
      },
      {
        threadId: 1,
        threadCounter: 0,
        payload: '{}',
      },
      {
        threadId: 0,
        threadCounter: 1,
        payload: '{}',
      },
    ]

    const database = {
      all: async (...args: Array<any>) => events,
    }

    const eventsTableName = 'eventsTableName'

    const adapterPool = {
      database,
      escapeId,
      escape,
      eventsTableName,
      shapeEvent,
    } as AdapterPool

    const { cursor } = await loadEventsByCursor(adapterPool, {
      cursor: null,
      limit: 1,
    })

    const baseCursor = Array.from(Array(2048)).fill('A').join('')

    expect(cursor).not.toEqual(null)
    expect(cursor?.length).toEqual(baseCursor.length)
    expect(cursor).not.toEqual(baseCursor)
  })
})
