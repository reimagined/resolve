import escapeId from '../src/escape-id'
import escapeStr from '../src/escape-str'
import listProperties from '../src/list-properties'

test('list-properties should work correctly', async () => {
  const properties = {
    a: 10,
    b: 'b',
    c: true,
  }

  const inlineLedgerExecuteStatement = jest.fn().mockReturnValue([
    {
      Properties: JSON.stringify(properties),
    },
  ])

  const schemaName = 'schemaName'
  const readModelName = 'readModelName'

  const result = await listProperties(
    {
      schemaName,
      escapeId,
      escapeStr,
      inlineLedgerExecuteStatement,
    } as any,
    readModelName
  )

  expect(result).toEqual(properties)
})
