import givenEvents from 'resolve-testing-tools'
import fs from 'fs'
import path from 'path'

import createConnector from './connector'
import projection from './projection'
import resolvers from './resolvers'

describe('Read-model generic adapter API', () => {
  const prefix = path.join(__dirname, 'test_files') + path.sep
  let connector = null
  beforeEach(() => {
    connector = createConnector({ prefix })
  })
  afterEach(() => {
    connector = null
  })

  beforeAll(() => {
    fs.mkdirSync(prefix)
  })

  afterAll(() => {
    for (const filename of fs.readdirSync(prefix)) {
      fs.unlinkSync(`${prefix}${filename}`)
    }
    fs.rmdirSync(prefix)
  })

  it('Insert and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INCREMENT',
        timestamp: 1,
        payload: 100
      },
      {
        aggregateId: 'ID',
        type: 'DECREMENT',
        timestamp: 2,
        payload: 200
      },
      {
        aggregateId: 'ID',
        type: 'INCREMENT',
        timestamp: 3,
        payload: 300
      }
    ])
      .readModel({
        name: 'ReadModelName',
        projection,
        resolvers,
        adapter: connector
      })
      .read({})

    expect(result).toEqual(200)
  })
})
