import { readFileSync } from 'fs'
import FormData from 'form-data'

import parseMultipartData from '../src/parse-multipart-data'

test('method "parseMultipartData" should work correctly', async () => {
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

  const multipartData = await parseMultipartData(
    form.getBuffer(),
    form.getHeaders()
  )

  if (multipartData == null) {
    expect(multipartData).not.toEqual(null)
    throw new TypeError()
  }

  const { files, fields } = multipartData

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
})
