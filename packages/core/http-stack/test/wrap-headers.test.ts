import wrapHeadersCaseInsensitive from '../src/wrap-headers-case-insensitive'

test('method "wrapHeaders" should work correctly', () => {
  const headers = wrapHeadersCaseInsensitive({
    Origin: 'example.com',
    'Content-Length': '10',
    'x-aws-request-id': '1234567890',
  })

  expect(headers.origin).toEqual('example.com')
  expect(headers.Origin).toEqual('example.com')
  expect(headers['Content-Length']).toEqual('10')
  expect(headers['Content-length']).toEqual('10')
  expect(headers['content-length']).toEqual('10')
  expect(headers['x-aws-request-id']).toEqual('1234567890')
  expect(headers['X-Aws-Request-Id']).toEqual('1234567890')
  expect(headers['X-AWS-Request-Id']).toEqual('1234567890')

  expect(Object.keys(headers)).toEqual([
    'origin',
    'content-length',
    'x-aws-request-id',
  ])

  expect('origin' in headers).toEqual(true)
  expect('Origin' in headers).toEqual(true)

  expect(() => {
    headers.origin = 'sub.example.com'
  }).toThrow(TypeError)
  expect(headers.origin).toEqual('example.com')
})
