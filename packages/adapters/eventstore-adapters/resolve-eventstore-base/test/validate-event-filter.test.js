import validateEventFilter from '../src/validate-event-filter'

describe('validate-event-filter should works correctly with', () => {
  test(`{ aggregateIds: '*' }`, () => {
    expect(() =>
      validateEventFilter({
        aggregateIds: null,
        limit: 200,
      })
    ).not.toThrow()
  })

  test(`{ aggregateIds: ['id1', 'id2'] }`, () => {
    expect(() =>
      validateEventFilter({
        aggregateIds: ['id1', 'id2'],
        limit: 200,
      })
    ).not.toThrow()
  })
})
