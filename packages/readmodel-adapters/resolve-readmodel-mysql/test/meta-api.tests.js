import { expect } from 'chai'
import sinon from 'sinon'

import metaApi from '../src/meta-api'

describe('resolve-readmodel-memory meta-api', () => {
  const META_NAME = 'META_NAME'

  it('should provide getMetaInfo method', async () => {
    const executor = sinon.stub()
    const pool = {
      connection: { execute: executor },
      metaName: META_NAME
    }

    const tableDeclarations = [
      {
        TableName: 'table1',
        TableDescription: {
          fieldTypes: { id: 'number', vol: 'string', content: 'json' },
          primaryIndex: { name: 'id', type: 'number' },
          secondaryIndexes: [{ name: 'vol', type: 'string' }]
        }
      },
      {
        TableName: 'table2',
        TableDescription: {
          fieldTypes: { id: 'number', vol: 'string', content: 'json' },
          primaryIndex: { name: 'id', type: 'number' },
          secondaryIndexes: [{ name: 'vol', type: 'string' }]
        }
      }
    ]

    executor.onCall(0).callsFake(async () => null)
    executor.onCall(1).callsFake(async () => [[{ Timestamp: 100 }]])
    executor.onCall(2).callsFake(async () => [tableDeclarations])

    await metaApi.getMetaInfo(pool)
    expect(pool.metaInfo.tables['table1']).to.be.deep.equal(tableDeclarations[0].TableDescription)
    expect(pool.metaInfo.tables['table2']).to.be.deep.equal(tableDeclarations[1].TableDescription)
    expect(pool.metaInfo.timestamp).to.be.deep.equal(100)

    expect(executor.firstCall.args[0]).to.be.equal(
      'CREATE TABLE IF NOT EXISTS META_NAME (\n      MetaKey VARCHAR(36) NOT NULL,\n' +
        '      MetaField VARCHAR(128) NOT NULL,\n      SimpleValue BIGINT NULL,\n' +
        '      ComplexValue JSON NULL,\n      PRIMARY KEY (MetaKey, MetaField)\n    )'
    )

    expect(executor.secondCall.args[0]).to.be.equal(
      'SELECT SimpleValue AS Timestamp FROM META_NAME\n     ' +
        'WHERE MetaKey="Timestamp" AND MetaField="Timestamp"'
    )

    expect(executor.thirdCall.args[0]).to.be.equal(
      'SELECT MetaField AS TableName, ComplexValue AS TableDescription\n     ' +
        'FROM META_NAME WHERE MetaKey="Tables"'
    )
  })

  it('should provide getLastTimestamp method', async () => {})

  it('should provide setLastTimestamp method', async () => {})

  it('should provide storageExists method', async () => {})

  it('should provide getStorageInfo method', async () => {})

  it('should provide describeStorage method', async () => {})

  it('should provide getStorageNames method', async () => {})

  it('should provide drop method', async () => {})
})
