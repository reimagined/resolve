import givenEvents from '@resolve-js/testing-tools'

import createPostgresqlServerlessAdapter from '@resolve-js/readmodel-postgresql-serverless'
import createPostgresqlAdapter from '@resolve-js/readmodel-postgresql'
import createMysqlAdapter from '@resolve-js/readmodel-mysql'
import createLiteAdapter from '@resolve-js/readmodel-lite'

jest.setTimeout(1000 * 60 * 5)

describe.each([
  [
    'postgresql-serverless',
    createPostgresqlServerlessAdapter,
    {
      dbClusterOrInstanceArn: process.env.POSTGRESQL_SERVERLESS_CLUSTER_ARN,
      awsSecretStoreArn: process.env.POSTGRESQL_SERVERLESS_USER_SECRET_ARN,
      databaseName: process.env.POSTGRESQL_SERVERLESS_DATABASE_NAME,
      region: process.env.POSTGRESQL_SERVERLESS_AWS_REGION,
      accessKeyId: process.env.POSTGRESQL_SERVERLESS_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.POSTGRESQL_SERVERLESS_AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.POSTGRESQL_SERVERLESS_AWS_SESSION_TOKEN,
    },
  ],
  [
    'postgresql',
    createPostgresqlAdapter,
    {
      databaseName: process.env.POSTGRESQL_DATABASE_NAME,
      user: process.env.POSTGRESQL_USER,
      password: process.env.POSTGRESQL_PASSWORD,
      database: process.env.POSTGRESQL_DATABASE,
      host: process.env.POSTGRESQL_HOST,
      port: process.env.POSTGRESQL_PORT,
    },
  ],
  [
    'mysql',
    createMysqlAdapter,
    {
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
    },
  ],
  [
    'lite',
    createLiteAdapter,
    {
      databaseFile: ':memory:',
    },
  ],
])('Read-model generic adapter API %s', (name, factory, options) => {
  if (
    !Object.values(options).reduce(
      (acc, value) => acc && value != null && value.length > 0,
      true
    )
  ) {
    console.log(
      `Skipping ${name} adapter due options absence, provided config: ${JSON.stringify(
        options
      )}`
    )
    return
  }

  let adapter: ReturnType<typeof factory> = null! as any
  beforeEach(async () => {
    adapter = (factory as any)(options as any) as ReturnType<typeof factory>
  })
  afterEach(async () => {
    adapter = null
  })

  test('Update set nested fields', async () => {
    expect(
      await givenEvents([])
        .readModel({
          projection: {
            Init: async (store) => {
              await store.defineTable('Table', {
                indexes: { id: 'string' },
                fields: ['items'],
              })

              await store.defineTable('Results', {
                indexes: { id: 'number' },
                fields: ['value'],
              })

              const aggregateId = 'aggregateId'
              const itemId = 'itemId'
              const itemText = 'itemText'
              await store.insert('Table', {
                id: aggregateId,
                items: {},
              })

              await store.insert('Results', {
                id: 0,
                value: await store.findOne('Table', {}),
              })

              await store.update(
                'Table',
                { id: aggregateId },
                {
                  $set: { [`items.${itemId}.itemText`]: itemText },
                }
              )

              await store.insert('Results', {
                id: 1,
                value: await store.findOne('Table', {}),
              })

              await store.update(
                'Table',
                { id: aggregateId },
                {
                  $set: { items: {} },
                }
              )

              await store.insert('Results', {
                id: 2,
                value: await store.findOne('Table', {}),
              })

              await store.update(
                'Table',
                { id: aggregateId },
                {
                  $set: { [`items.${itemId}`]: { itemText } },
                }
              )

              await store.insert('Results', {
                id: 3,
                value: await store.findOne('Table', {}),
              })

              await store.update(
                'Table',
                { id: aggregateId },
                {
                  $set: { [`items.${itemId}.otherField`]: null },
                }
              )

              await store.insert('Results', {
                id: 4,
                value: await store.findOne('Table', {}),
              })
            },
          },
          resolvers: {
            all: async (store) => {
              return (
                await store.find('Results', {}, { value: 1 }, { id: 1 })
              ).map(({ value }) => value)
            },
          },
          adapter,
          name,
        })
        .all()
    ).toEqual([
      { id: 'aggregateId', items: {} },
      { id: 'aggregateId', items: { itemId: { itemText: 'itemText' } } },
      { id: 'aggregateId', items: {} },
      { id: 'aggregateId', items: { itemId: { itemText: 'itemText' } } },
      {
        id: 'aggregateId',
        items: { itemId: { itemText: 'itemText', otherField: null } },
      },
    ])
  })
})
