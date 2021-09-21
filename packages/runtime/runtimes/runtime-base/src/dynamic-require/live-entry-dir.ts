import path from 'path'
import { entryPointMarker } from './entry-point-marker'
import { pureRequire } from './pure-require'

const entryPointDirnamePlaceholder = Symbol('EntryPointDirnamePlaceholder')
let entryPointDirname: string | symbol | undefined = entryPointDirnamePlaceholder
const dynamicRequire = pureRequire as typeof require

export const liveEntryDir = (): string | null => {
  if (entryPointDirname === entryPointDirnamePlaceholder) {
    entryPointDirname = (
      Object.values(dynamicRequire.cache).find((module) => {
        return (
          module?.exports != null &&
          module.exports.entryPointMarker === entryPointMarker
        )
      }) ?? {}
    ).filename

    if (entryPointDirname != null && typeof entryPointDirname === 'string') {
      entryPointDirname = path.dirname(entryPointDirname)
    }
  }

  return entryPointDirname != null ? entryPointDirname.toString() : null
}
