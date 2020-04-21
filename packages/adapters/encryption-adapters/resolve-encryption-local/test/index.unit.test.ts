import { promisify } from 'util'
import { pipeline } from 'stream'
import createEncryptionAdapter from '../src'
import { AlgorithmOptions } from 'resolve-encryption-base'

const config = {
  algorithm: {
    type: 'AES256'
  } as AlgorithmOptions,
  keyStore: {
    databaseFile: ':memory:'
  }
}

describe('event encryption local', () => {
  test('encrypt/decrypt', async () => {
    const encryptionAdapter = createEncryptionAdapter(config)

    await encryptionAdapter.init()

    const encryptor1 = await encryptionAdapter.getEncrypter('aggregate-id-1')
    const decryptor1 = await encryptionAdapter.getDecrypter('aggregate-id-1')

    const encryptor2 = await encryptionAdapter.getEncrypter('aggregate-id-2')
    const decryptor2 = await encryptionAdapter.getDecrypter('aggregate-id-2')

    if (encryptor1 !== null && decryptor1 !== null) {
      expect(await decryptor1(await encryptor1('12345'))).toEqual('12345')
    }
    if (encryptor2 !== null && decryptor2 !== null) {
      expect(await decryptor2(await encryptor2('34567'))).toEqual('34567')
    }
    await encryptionAdapter.dispose()
  })

  test('export', async done => {
    const keysNumber = 700
    const encryptionAdapter = createEncryptionAdapter(config)

    await encryptionAdapter.init()

    for (let i = 0; i < keysNumber; i++) {
      let encryptor = await encryptionAdapter.getEncrypter(`aggregate-id-${i}`)
    }
    let chunksCount = 0
    if (encryptionAdapter.createExportStream) {
      const stream = await encryptionAdapter.createExportStream({
        cursor: 0
      })

      stream.on('data', (chunk: any) => {
        const parsed = JSON.parse(chunk.toString())
        expect(parsed.id).toEqual(expect.any(String))
        expect(parsed.key).toEqual(expect.any(String))
        expect(Object.keys(parsed).length).toEqual(2)
        chunksCount++
      })
      stream.on('end', () => {
        if (chunksCount === keysNumber) {
          done()
        }
      })
    }
  })

  test('export/import', async done => {
    const keysNumber = 1500
    const encryptionAdapter1 = createEncryptionAdapter(config)
    const encryptionAdapter2 = createEncryptionAdapter(config)

    await encryptionAdapter1.init()
    await encryptionAdapter2.init()

    for (let i = 0; i < keysNumber; i++) {
      let encryptor = await encryptionAdapter1.getEncrypter(`aggregate-id-${i}`)
    }

    if (
      encryptionAdapter1.createExportStream &&
      encryptionAdapter2.createImportStream
    ) {
      const exportStream = await encryptionAdapter1.createExportStream({
        cursor: 0
      })
      const importStream = await encryptionAdapter2.createImportStream({
        byteOffset: 0
      })

      await promisify(pipeline)(exportStream, importStream)

      let chunksCount = 0
      if (encryptionAdapter2.createExportStream) {
        const stream = await encryptionAdapter2.createExportStream({
          cursor: 0
        })

        stream.on('data', (chunk: any) => {
          chunksCount++
        })
        stream.on('end', () => {
          if (chunksCount === keysNumber) {
            done()
          }
        })
      }
    }
  })
})
