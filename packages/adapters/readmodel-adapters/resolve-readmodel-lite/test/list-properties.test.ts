import { escapeStr, escapeId } from '../src/connect'
import listProperties from '../src/list-properties'

test('list-properties should work correctly', async () => {
  const properties = {
    a: 10,
    b: 'b',
    c: true,
  }

  const PassthroughError = Error
  //eslint-disable-next-line @typescript-eslint/no-empty-function
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
      escapeStr,
    } as any,
    readModelName
  )

  expect(result).toEqual(properties)
})
