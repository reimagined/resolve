import createEncryptionAdapter from '../src'
import { create, destroy } from '../src'
import { AlgorithmOptions } from 'resolve-encryption-base'
import { v4 } from 'uuid'

const config = {
  algorithm: {
    type: 'AES256'
  } as AlgorithmOptions,
  keyStore: {
    region: 'us-east-1',
    secretArn:
      'arn:aws:secretsmanager:us-east-1:650139044964:secret:rsai8qo76xe367ai56jzhz3j3sv1/dev/postgresUser/6D2jG8peJB-zAOW5e',
    resourceArn:
      'arn:aws:rds:us-east-1:650139044964:cluster:postgresql-serverless',
    databaseName: 'rsai8qo76xe367ai56jzhz3j3sv1-dev',
    tableName: 'keys'
  }
}

describe('event encryption cloud', () => {
  test('adapter test', async () => {
    const encryptionAdapter = createEncryptionAdapter(config)

    await encryptionAdapter.init()

    const encryptor1 = await encryptionAdapter.getEncrypter(
      '00000000-0000-0000-0000-000000000001'
    )
    const decryptor1 = await encryptionAdapter.getDecrypter(
      '00000000-0000-0000-0000-000000000001'
    )

    const encryptor2 = await encryptionAdapter.getEncrypter(
      '00000000-0000-0000-0000-000000000002'
    )
    const decryptor2 = await encryptionAdapter.getDecrypter(
      '00000000-0000-0000-0000-000000000002'
    )

    let result
    if (decryptor1 != null && encryptor1 != null) {
      result = await decryptor1(await encryptor1('12345'))
      expect(result).toEqual('12345')
    }

    if (decryptor2 != null && encryptor2 != null) {
      result = await decryptor2(await encryptor2('34567'))
      expect(result).toEqual('34567')
    }

    await encryptionAdapter.dispose()
  }, 10000)

  /*   test('create resource', async () => {
    const resourceOptions = {
      dbClusterOrInstanceArn:
        'arn:aws:rds:us-east-1:650139044964:cluster:postgresql-serverless',
      awsSecretStoreAdminArn:
        'arn:aws:secretsmanager:us-east-1:650139044964:secret:postgresql-serverless-eSsFnl',
      databaseName: 'keysdatabase',
      tableName: 'keystable',
      region: 'us-east-1',
      userLogin: 'test-user-login'
    }
    // await create(resourceOptions)
    // await destroy(resourceOptions)
  }, 15000) */

  test('export', async done => {
    const encryptionAdapter = createEncryptionAdapter(config)

    await encryptionAdapter.init()

    for (let i = 0; i < 15; i++) {
      let encryptor = await encryptionAdapter.getEncrypter(v4())
    }
    let chuncksCount = 0
    if (encryptionAdapter.createExportStream) {
      const s = await encryptionAdapter.createExportStream({
        cursor: 0
        // bufferSize: 8192
      })

      s.on('data', (chunk: any) => {
        chuncksCount++
        //console.log(chunk.toString())
        //s.pause()
        //setTimeout(() => {
        //  s.resume()
        //}, 1000)
      })
      s.on('error', (error: Error) => {
        console.log(error)
      })
      s.on('end', () => {
        console.log(chuncksCount)
        done()
      })
    }
  }, 15000)
})
