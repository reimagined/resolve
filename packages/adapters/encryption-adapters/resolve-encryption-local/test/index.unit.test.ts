import createEncryptionAdapter from '../src'

describe('event encryption local', () => {
  test('test', async () => {
    const ecryptionAdapter = createEncryptionAdapter({
      algorithm: {
        type: 'AES256'
      },
      keyStore: {
        databaseFile: ':memory:'
      }
    })

    await ecryptionAdapter.init()

    const encryptor1 = await ecryptionAdapter.getEncrypter('aggregate-id-1')
    const decryptor1 = await ecryptionAdapter.getDecrypter('aggregate-id-1')

    const encryptor2 = await ecryptionAdapter.getEncrypter('aggregate-id-2')
    const decryptor2 = await ecryptionAdapter.getDecrypter('aggregate-id-2')

    if (decryptor1 != null) {
      console.log(await decryptor1(await encryptor1('12345')))
    }
    if (decryptor2 != null) {
      console.log(await decryptor2(await encryptor2('34567')))
    }

    await ecryptionAdapter.dispose()
  })
})
