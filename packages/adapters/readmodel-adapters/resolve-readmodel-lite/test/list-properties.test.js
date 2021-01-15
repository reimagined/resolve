import { escape, escapeId } from '../src/connect'
import listProperties from '../src/list-properties'

test('list-properties should work correctly', async () => {
  const properties = {
    a: 10,
    b: 'b',
    c: true,
  }

  const PassthroughError = Error
  const fullJitter = () => {}
  const inlineLedgerRunQuery = jest.fn().mockReturnValue([
    {
      Properties: JSON.stringify(properties),
    },
  ])
  const tablePrefix = '__tablePrefix__'

  const readModelName = 'readModelName'

  const result = await listProperties(
    {
      PassthroughError,
      fullJitter,
      inlineLedgerRunQuery,
      tablePrefix,
      escapeId,
      escape,
    },
    readModelName
  )

  expect(result).toEqual(properties)
})
