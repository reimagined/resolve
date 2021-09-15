import * as fs from 'fs'
import * as path from 'path'
import { DomainMeta } from '@resolve-js/core'
import liveEntryDir from './dynamic-require/live-entry-dir'

type ReadModelProcedureLoaderContext = {
  readModels: DomainMeta['readModels']
}

export const readModelProcedureLoaderFactory = (
  context: ReadModelProcedureLoaderContext
) => {
  const cache: { [key: string]: string | null } = {}
  const { readModels } = context

  return async (readModelName: string) => {
    if (!cache.hasOwnProperty(readModelName)) {
      cache[readModelName] = null
      const entryDir = liveEntryDir()
      if (
        readModels.find(({ name }) => name === readModelName) &&
        entryDir != null
      ) {
        try {
          cache[readModelName] = fs
            .readFileSync(
              path.join(String(entryDir), `read-model-${readModelName}.js`)
            )
            .toString('utf8')
        } catch (err) {}
      }
    }
    return cache[readModelName]
  }
}
