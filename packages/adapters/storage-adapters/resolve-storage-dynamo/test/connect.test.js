import sinon from 'sinon'

import connect from '../src/connect'
import { apiVersion } from '../src/constants'

describe('method "connect"', () => {
  test('should init pool', async () => {
    const database = {
      name: 'database',
      createTable: sinon
        .stub()
        .returns({ promise: sinon.stub().returns(Promise.resolve()) })
    }
    const documentClient = { name: 'documentClient' }
    const DynamoDB = sinon.stub().returns(database)
    DynamoDB.DocumentClient = sinon.stub().returns(documentClient)

    const pool = {
      config: {
        region: 'region',
        endpoint: 'endpoint',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
        tableName: 'tableName',
        readCapacityUnits: 1,
        writeCapacityUnits: 1
      }
    }
    const helpers = { helper1: () => {}, helper2: () => {} }

    const checkTableExists = sinon.stub()
    checkTableExists.onCall(0).returns(Promise.resolve(false))
    checkTableExists.onCall(1).returns(Promise.resolve(false))
    checkTableExists.returns(Promise.resolve(true))

    await connect(
      pool,
      { DynamoDB, checkTableExists, ...helpers }
    )

    sinon.assert.calledWith(DynamoDB, {
      region: pool.config.region,
      endpoint: pool.config.endpoint,
      accessKeyId: pool.config.accessKeyId,
      secretAccessKey: pool.config.secretAccessKey,
      apiVersion
    })
    sinon.assert.calledWith(DynamoDB.DocumentClient, {
      region: pool.config.region,
      endpoint: pool.config.endpoint,
      accessKeyId: pool.config.accessKeyId,
      secretAccessKey: pool.config.secretAccessKey,
      apiVersion
    })
    expect(pool.helper1).toEqual(helpers.helper1)
    expect(pool.helper2).toEqual(helpers.helper2)
  })
})
