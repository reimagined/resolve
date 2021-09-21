import path from 'path'
import { entryPointMarker } from './entry-point-marker'
import { pureRequire } from './pure-require'

const entryPointDirnamePlaceholder = Symbol('EntryPointDirnamePlaceholder')
let entryPointDirname: string | symbol = entryPointDirnamePlaceholder

export const liveEntryDir = (): string => {
  if (entryPointDirname === entryPointDirnamePlaceholder) {
    entryPointDirname = (
      Object.values(pureRequire.cache).find(({ exports }) => {
        return exports != null && exports.entryPointMarker === entryPointMarker
      }) ?? {}
    ).filename

    if (entryPointDirname != null && typeof entryPointDirname === 'string') {
      entryPointDirname = path.dirname(entryPointDirname)
    }
  }

  return entryPointDirname?.toString()
}
