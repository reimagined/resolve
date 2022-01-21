import getContentType from '../src/get-content-type'

test('method "getContentType" should work correctly', () => {
  expect(getContentType({})).toEqual({})

  expect(
    getContentType({
      'content-type': 'application/json',
    })
  ).toEqual({
    mediaType: 'application/json',
  })

  expect(
    getContentType({
      'content-type': 'text/html; charset=utf-8',
    })
  ).toEqual({
    mediaType: 'text/html',
    charset: 'utf-8',
  })

  expect(
    getContentType({
      'content-type':
        'multipart/form-data; boundary=---------------------------974767299852498929531610575',
    })
  ).toEqual({
    mediaType: 'multipart/form-data',
    boundary: '---------------------------974767299852498929531610575',
  })
})
