import getRootBasedUrl from '../src/get_root_based_url'

describe('getRootBasedUrl', () => {
  test('should return root based URL', () => {
    expect(
      getRootBasedUrl('http://localhost:3000', 'my-app', '/api/query')
    ).toEqual('http://localhost:3000/my-app/api/query')
  })

  test('should return normal URL', () => {
    expect(getRootBasedUrl('http://localhost:3000', '', '/api/query')).toEqual(
      'http://localhost:3000/api/query'
    )
  })
})
