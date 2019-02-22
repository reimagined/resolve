import sinon from 'sinon'

import createResolver from '../src/create-resolver'

test('method "createResolver" should create resolver [success]', async () => {
  const modelName = 'modelName'
  const resolverName = 'resolverName'
  const resolverArgs = { a: true, b: false }
  const jwtToken = 'jwtToken'

  const query = {
    read: sinon.stub().callsFake(options => ({ result: options }))
  }
  const pool = { modelName, query }

  const resolver = createResolver(pool, resolverName)

  const result = await resolver(resolverArgs, jwtToken)

  expect(result).toEqual({
    result: {
      modelName,
      resolverName,
      resolverArgs,
      jwtToken
    }
  })
})

test('method "createResolver" should create resolver [failure]', async () => {
  const error = new Error('test')

  const modelName = 'modelName'
  const resolverName = 'resolverName'
  const resolverArgs = { a: true, b: false }
  const jwtToken = 'jwtToken'

  const query = {
    read: sinon.stub().callsFake(() => { throw error })
  }
  const pool = { modelName, query }

  const resolver = createResolver(pool, resolverName)

  try {
    await resolver(resolverArgs, jwtToken)
    throw new Error('fail')
  } catch (err) {
    expect(err).toEqual(error)
  }
})
