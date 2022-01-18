import { importEventstore, createAdapter, createEventstore } from './utils'
import minimist from 'minimist'

const parsed = minimist(process.argv.slice(2))
let dbName: string
let esDirectory: string

let shouldCreate = parsed['create'] === 'true'

if (parsed._.length === 2) {
  dbName = parsed._[0]
  esDirectory = parsed._[1]
} else {
  console.error(
    'Expected database (schema) name and path to directory with eventstore'
  )
  process.exit(1)
}

void (async () => {
  if (shouldCreate) {
    await createEventstore(dbName)
  }

  const adapter = createAdapter(dbName)
  try {
    await importEventstore(adapter, esDirectory)
    const description = await adapter.describe()
    console.log(
      `Successfully imported eventstore from ${esDirectory} into ${dbName} database: ${description.eventCount} events, ${description.secretCount} secrets`
    )
  } finally {
    await adapter.dispose()
  }
})()
