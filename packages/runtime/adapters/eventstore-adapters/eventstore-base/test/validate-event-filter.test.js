import validateEventFilter from '../src/validate-event-filter'

describe('validate-event-filter should works correctly with', () => {
  test(`{ aggregateIds: '*' }`, () => {
    expect(() =>
      validateEventFilter({
        aggregateIds: null,
        limit: 200,
        cursor: null,
      })
    ).not.toThrow()
  })

  test(`{ aggregateIds: ['id1', 'id2'] }`, () => {
    expect(() =>
      validateEventFilter({
        aggregateIds: ['id1', 'id2'],
        limit: 200,
        cursor: null,
      })
    ).not.toThrow()
  })
})

describe('validate-event-filter should throw when', () => {
  test('has no limit provided', () => {
    expect(() => validateEventFilter({ cursor: null })).toThrow()
  })

  test(`has conflicting fields`, () => {
    expect(() =>
      validateEventFilter({
        limit: 200,
        cursor: 'AAAA',
        startTime: 1,
      })
    ).toThrow()

    expect(() =>
      validateEventFilter({
        limit: 200,
        cursor: 'AAAA',
        finishTime: 2,
      })
    ).toThrow()
  })

  test(`array values are not string arrays`, () => {
    expect(() =>
      validateEventFilter({
        limit: 200,
        cursor: null,
        aggregateIds: 'id',
      })
    ).toThrow()

    expect(() =>
      validateEventFilter({
        limit: 200,
        cursor: null,
        eventTypes: 'type',
      })
    ).toThrow()
  })

  test(`startTime is larger than finishTime`, () => {
    expect(() =>
      validateEventFilter({
        limit: 200,
        startTime: 3,
        finishTime: 2,
      })
    ).toThrow()
  })

  test(`limit is not integer`, () => {
    expect(() =>
      validateEventFilter({
        limit: 200.5,
        startTime: 1,
        finishTime: 2,
      })
    ).toThrow()
  })

  test(`startTime or finishTime is not integer`, () => {
    expect(() =>
      validateEventFilter({
        limit: 200,
        startTime: 1.5,
        finishTime: 2,
      })
    ).toThrow()

    expect(() =>
      validateEventFilter({
        limit: 200,
        startTime: 1,
        finishTime: 2.5,
      })
    ).toThrow()
  })

  test(`cursor is not a string and not a null`, () => {
    expect(() =>
      validateEventFilter({
        limit: 200,
        cursor: 10,
      })
    ).toThrow()
  })
})
