import { stringify as stringifyQuery } from 'query-string'

import bodyParser from '../src/body-parser'

const parseUrlencoded = bodyParser.urlencoded

test('should work correctly', async () => {
  const body: Buffer = Buffer.from(
    stringifyQuery({ a: 'test', b: ['one', 'two'] }, { arrayFormat: 'bracket' })
  )
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
  }
  const parsedBody = await parseUrlencoded({ body, headers })

  expect(parsedBody).toEqual({ a: 'test', b: ['one', 'two'] })
})

test('should be return null if body has null', async () => {
  const body = null
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
  }
  const parsedBody = await parseUrlencoded({ body, headers })

  expect(parsedBody).toBeUndefined()
})

test('should be return null if content-type has null', async () => {
  const body: Buffer = Buffer.from(
    stringifyQuery({ a: 'test', b: ['one', 'two'] }, { arrayFormat: 'bracket' })
  )
  const headers = {}
  const parsedBody = await parseUrlencoded({ body, headers })

  expect(parsedBody).toBeUndefined()
})

test('should be return null if content-type is not valid', async () => {
  const body: Buffer = Buffer.from(
    stringifyQuery({ a: 'test', b: ['one', 'two'] }, { arrayFormat: 'bracket' })
  )
  const headers = {
    'content-type': 'application/x-www-form-urlencoded-test',
  }
  const parsedBody = await parseUrlencoded({ body, headers })

  expect(parsedBody).toBeUndefined()
})
