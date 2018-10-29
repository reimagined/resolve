import sinon from 'sinon'

import createResolvers from '../src/create-resolvers'

test('method "createResolvers" should create resolvers', async () => {
  const createResolver = sinon.stub().callsFake(() => sinon.stub())
  const pool = { createResolver, resolvers: { a: () => {}, b: () => {} } }

  const resolvers = createResolvers(pool)

  expect(Object.keys(resolvers)).toEqual(['a', 'b'])
})
