import parserFactory from '../src/body-parser/parser-factory'

const parseCustom = parserFactory({
  predicate: ({ type, subType, params: { enabled } }) =>
    enabled === 'true' && type === 'custom' && subType === 'test',
  parser: async (rawBody, contentType, parsedContentType) => ({
    rawBody,
    contentType,
    parsedContentType,
  }),
})

test('should work correctly', async () => {
  const rawBody: Buffer = Buffer.from('body')
  const headers = {
    'content-type': 'custom/test;enabled=true',
  }
  const parsedBody = await parseCustom({ rawBody, headers })

  expect(parsedBody).toEqual({
    rawBody,
    contentType: 'custom/test;enabled=true',
    parsedContentType: {
      type: 'custom',
      subType: 'test',
      params: expect.objectContaining({ enabled: 'true' }),
    },
  })
})

// test('should be return null if body has null', async () => {
//   const rawBody = null
//   const headers = {
//     'content-type': 'application/x-www-form-urlencoded',
//   }
//   const parsedBody = await parseUrlencoded({ rawBody, headers })

//   expect(parsedBody).toBeUndefined()
// })

// test('should be return null if content-type has null', async () => {
//   const rawBody: Buffer = Buffer.from(
//     stringifyQuery({ a: 'test', b: ['one', 'two'] }, { arrayFormat: 'bracket' })
//   )
//   const headers = {}
//   const parsedBody = await parseUrlencoded({ rawBody, headers })

//   expect(parsedBody).toBeUndefined()
// })

// test('should be return null if content-type is not valid', async () => {
//   const rawBody: Buffer = Buffer.from(
//     stringifyQuery({ a: 'test', b: ['one', 'two'] }, { arrayFormat: 'bracket' })
//   )
//   const headers = {
//     'content-type': 'application/x-www-form-urlencoded-test',
//   }
//   const parsedBody = await parseUrlencoded({ rawBody, headers })

//   expect(parsedBody).toBeUndefined()
// })
