import path from 'path'
import entryPointMarker from './entry-point-marker'
import pureRequire from './pure-require'

const entryPointDirnamePlaceholder = Symbol('EntryPointDirnamePlaceholder')
let entryPointDirname = entryPointDirnamePlaceholder

const liveEntryDir = () => {
  if (entryPointDirname === entryPointDirnamePlaceholder) {
    entryPointDirname = (
      Object.values(pureRequire.cache).find(
        ({ exports }) =>
          exports != null && exports.entryPointMarker === entryPointMarker
      ) || {}
    ).filename

    if (entryPointDirname != null) {
      entryPointDirname = path.dirname(entryPointDirname)
    }
  }

  return entryPointDirname
}

export default liveEntryDir
