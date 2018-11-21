import sinon from 'sinon'

import create from '../src/resource/create'
import dispose from '../src/resource/dispose'
import destroy from '../src/resource/destroy'
import setupAutoScalingItem from '../src/resource/setup-auto-scaling-item'
import setupAutoScaling from '../src/resource/setup-auto-scaling'

describe('as resource', () => {
  test('method "create" works correctly', async () => {
    const EOL = '\r\n'
    const autoScalingResult = []
    const ApplicationAutoScaling = class {
      constructor(config) {
        autoScalingResult.push(JSON.stringify(config, null, 2))
      }
      registerScalableTarget(config) {
        autoScalingResult.push(JSON.stringify(config, null, 2))
        return { promise: () => Promise.resolve() }
      }
      putScalingPolicy(config) {
        autoScalingResult.push(JSON.stringify(config, null, 2))
        return { promise: () => Promise.resolve() }
      }
    }

    const adapter = {
      init: sinon.stub()
    }
    const createAdapter = sinon.stub().returns(adapter)
    const pool = {
      ApplicationAutoScaling,
      setupAutoScalingItem,
      setupAutoScaling,
      createAdapter
    }

    const region = 'region-test'
    const tableName = 'tableName'
    const readCapacityUnits = 23
    const writeCapacityUnits = 43

    await create(pool, {
      region,
      tableName,
      readCapacityUnits,
      writeCapacityUnits
    })

    sinon.assert.calledWith(createAdapter, {
      region,
      tableName,
      readCapacityUnits,
      writeCapacityUnits,
      skipInit: true
    })
    sinon.assert.calledWith(adapter.init)
    expect(autoScalingResult.join(EOL)).toMatchSnapshot()
  })

  test('method "dispose" works correctly', async () => {
    const adapter = {
      init: sinon.stub()
    }
    const createAdapter = sinon.stub().returns(adapter)
    const destroy = sinon.stub().returns(Promise.resolve())
    const pool = { createAdapter, destroy }

    const region = 'region-test'
    const tableName = 'tableName'
    const newTableName = 'newTableName'
    const readCapacityUnits = 23
    const writeCapacityUnits = 43

    await dispose(pool, {
      region,
      tableName,
      newTableName,
      readCapacityUnits,
      writeCapacityUnits
    })

    sinon.assert.calledWith(createAdapter, {
      region,
      tableName: newTableName,
      readCapacityUnits,
      writeCapacityUnits,
      skipInit: true
    })
    sinon.assert.calledWith(adapter.init)
    sinon.assert.calledWith(destroy, pool, {
      region,
      tableName,
      readCapacityUnits,
      writeCapacityUnits
    })
  })

  test('method "destroy" works correctly', async () => {
    const adapter = {
      dispose: sinon.stub()
    }
    const createAdapter = sinon.stub().returns(adapter)
    const pool = { createAdapter, destroy }

    const region = 'region-test'
    const tableName = 'tableName'
    const readCapacityUnits = 23
    const writeCapacityUnits = 43

    await destroy(pool, {
      region,
      tableName,
      readCapacityUnits,
      writeCapacityUnits
    })

    sinon.assert.calledWith(createAdapter, {
      region,
      tableName,
      readCapacityUnits,
      writeCapacityUnits,
      skipInit: true
    })
    sinon.assert.calledWith(adapter.dispose, { dropEvents: true })
  })
})
