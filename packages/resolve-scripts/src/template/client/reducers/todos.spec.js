import todos from './todos'

describe('todos reducer', () => {
  it('should handle TodoCreated', () => {
    expect(
      todos([], {
        'type': 'TodoCreated',
        'payload': {
          'completed': false,
          'text': '111'
        },
        'aggregateId': '1',
      })
    ).toEqual([{
      'aggregateId': '1',
      'completed': false,
      'text': '111'}
    ])

    expect(
      todos([{
        'aggregateId': '1',
        'completed': false,
        'text': '111'}
      ], {
        'type': 'TodoCreated',
        'payload': {
          'completed': false,
          'text': '222'
        },
        'aggregateId': '2',
      })
    ).toEqual([{
      'aggregateId': '1',
      'completed': false,
      'text': '111'
    }, {
      'aggregateId': '2',
      'completed': false,
      'text': '222'
    }])

  })

  it('should handle TodoCompleted', () => {
    expect(
      todos([{
        'aggregateId': '1',
        'completed': false,
        'text': '111'}
      ], {
        'type': 'TodoCompleted',
        'payload': { },
        'aggregateId': '1',
      })
    ).toEqual([{
      'aggregateId': '1',
      'completed': true,
      'text': '111'
    }])
  })

  it('should handle TodoReset', () => {
    expect(
      todos([{
        'aggregateId': '1',
        'completed': true,
        'text': '111'}
      ], {
        'type': 'TodoReset',
        'payload': { },
        'aggregateId': '1',
      })
    ).toEqual([{
      'aggregateId': '1',
      'completed': false,
      'text': '111'
    }])
  })
})
