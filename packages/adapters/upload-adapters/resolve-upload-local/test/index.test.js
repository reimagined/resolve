import createUploadAdapter from '../src/index'

jest.mock('fs')

describe('resolve-uploader-local', () => {
  let adapter = null
  let originalDateNow
  const host = 'host'
  const port = 'port'
  const protocol = 'protocol'
  const secretKey = 'secretKey'
  const dir = 'dir'

  beforeAll(() => {
    originalDateNow = Date.now.bind(Date)
    Date.now = () => 100500
  })
  afterAll(() => {
    Date.now = originalDateNow
  })

  beforeEach(() => {
    adapter = createUploadAdapter({
      host,
      port,
      protocol,
      secretKey
    })
  })

  test('should upload put', async () => {
    const { uploadUrl, uploadId } = await adapter.createPresignedPut(dir)

    expect(uploadUrl).toEqual(
      `${protocol}://${host}:${port}/upload?dir=${dir}&uploadId=${uploadId}`
    )

    await adapter.upload(uploadUrl, 'path.file')
  })

  test('should upload post', async () => {
    const { form, uploadId } = await adapter.createPresignedPost(dir)

    expect(form.url).toEqual(
      `${protocol}://${host}:${port}/upload?dir=${dir}&uploadId=${uploadId}`
    )

    await adapter.uploadFormData(form, 'path.file')
  })

  test('should return token', async () => {
    const token = adapter.createToken({ dir, expireTime: 100 })

    expect(token).toEqual(
      // eslint-disable-next-line spellcheck/spell-checker
      'eyJkaXIiOiJkaXIiLCJleHBpcmVUaW1lIjoyMDA1MDB9*94e4fada2d97a8a9e5bbe92ffaab7bf0'
    )
  })
})
