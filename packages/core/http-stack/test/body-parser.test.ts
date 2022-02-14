import { readFileSync } from 'fs'
import FormData from 'form-data'
import { stringify as stringifyQuery } from 'query-string'

import { bodyParser, MultipartData, UrlencodedData } from '../src/'

test('method "bodyParser.multipart" should work correctly', async () => {
  const customBuffer = Buffer.from('アニメの女の子')

  const form = new FormData()
  form.append('login', 'login')
  form.append('password', 'password')
  form.append('buffer', customBuffer)
  form.append('file', readFileSync(__filename))
  form.append('file', readFileSync(__filename), { filename: 'File1' })
  // eslint-disable-next-line spellcheck/spell-checker
  form.append('file', readFileSync(__filename), { filepath: 'tests/File2' })
  form.append('file', readFileSync(__filename), {
    filename: 'File3',
    contentType: 'text/plain',
  })

  const bodyParserResult: MultipartData = await bodyParser({
    body: form.getBuffer(),
    headers: form.getHeaders(),
  })
  const multipartParserResult = await bodyParser.multipart({
    body: form.getBuffer(),
    headers: form.getHeaders(),
  })

  if (multipartParserResult == null) {
    throw new TypeError()
  }

  for (const { files, fields } of [bodyParserResult, multipartParserResult]) {
    /* Fields */
    expect(fields).toEqual({
      login: 'login',
      password: 'password',
    })

    /* Files */
    expect(
      files.filter(
        ({ content }) => content.toString() === customBuffer.toString()
      )
    ).toHaveLength(1)
    expect(files.map(({ fileName }) => fileName)).toContain('File1')
    expect(files.map(({ fileName }) => fileName)).toContain('File2')
    expect(
      files.filter(({ fileName }) => fileName === 'File3')?.[0]
    ).toMatchObject({ fileName: 'File3', mimeType: 'text/plain' })
  }
})

test('method "bodyParser.urlencoded" should work correctly', async () => {
  const body: Buffer = Buffer.from(
    stringifyQuery({ a: 'test', b: ['one', 'two'] }, { arrayFormat: 'bracket' })
  )
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
  }
  const bodyParserResult: UrlencodedData = await bodyParser({ body, headers })
  const urlencodedParserResult = await bodyParser.urlencoded({ body, headers })

  for (const parsedBody of [bodyParserResult, urlencodedParserResult]) {
    expect(parsedBody).toEqual({ a: 'test', b: ['one', 'two'] })
  }
})

test('method "bodyParser" should return {} if body has not been parsed', async () => {
  expect(await bodyParser({ body: null, headers: {} })).toEqual({})
  expect(await bodyParser({ body: Buffer.from(``), headers: {} })).toEqual({})
  expect(
    await bodyParser({
      body: Buffer.from(``),
      headers: { 'content-type': 'application/json' },
    })
  ).toEqual({})
  expect(
    await bodyParser({
      body: Buffer.from(``),
      headers: { 'content-type': 'multipart/form-data' },
    })
  ).toEqual({})
  expect(
    await bodyParser({
      body: Buffer.from(``),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })
  ).toEqual({})
})
