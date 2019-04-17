import givenEvents from 'resolve-testing-tools'
import createReadModelLiteAdapter from 'resolve-readmodel-lite'
// import createReadModelMYSQLAdapter from 'resolve-readmodel-mysql'
// import createReadModelMongoAdapter from 'resolve-readmodel-mongo'

import projection from './projection'
import resolvers from './resolvers'

describe('Read-model Comments sample', () => {
  let adapter = null
  beforeEach(async () => {
    adapter = createReadModelLiteAdapter({
      databaseFile: ':memory:'
    })
    // adapter = createReadModelMYSQLAdapter({
    //   host: 'localhost',
    //   port: 3306,
    //   user: 'root',
    //   password: '',
    //   database: `Comments`
    // })
    // adapter = createReadModelMongoAdapter({
    //   url: 'mongodb://127.0.0.1:27017/Comments'
    // })
    try {
      await adapter.drop(null, 'Comments')
    } catch (e) {}
  })
  afterEach(async () => {
    try {
      await adapter.drop(null, 'Comments')
    } catch (e) {}
    adapter = null
  })

  const events = [
    {
      aggregateId: 'comment-id-1',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: null,
        content: 'Level 1'
      }
    },
    {
      aggregateId: 'comment-id-2',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-1',
        content: 'Level 1.1'
      }
    },
    {
      aggregateId: 'comment-id-3',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-2',
        content: 'Level 1.1.1'
      }
    },
    {
      aggregateId: 'comment-id-4',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-2',
        content: 'Level 1.1.2'
      }
    },
    {
      aggregateId: 'comment-id-5',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-2',
        content: 'Level 1.1.3'
      }
    },
    {
      aggregateId: 'comment-id-6',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-1',
        content: 'Level 1.2'
      }
    },
    {
      aggregateId: 'comment-id-7',
      type: 'COMMENT_CREATED',
      payload: {
        parentId: 'comment-id-1',
        content: 'Level 1.3'
      }
    }
  ]

  test(`resolve "getComments"`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Comments',
          projection,
          resolvers,
          adapter
        })
        .getComments({})
    ).toMatchSnapshot(`getComments`)
  })
})
