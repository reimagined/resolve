import path from 'path'

const entryPointDirnamePlaceholder = Symbol('EntryPointDirnamePlaceholder')
let entryPointDirname:
  | string
  | symbol
  | undefined = entryPointDirnamePlaceholder

export const liveEntryDir = (): string | null => {
  if (entryPointDirname === entryPointDirnamePlaceholder) {
    entryPointDirname = process.env.__RUNTIME_ENTRY_PATH

    if (entryPointDirname != null && entryPointDirname.constructor === String) {
      entryPointDirname = path.dirname(entryPointDirname)
    }
  }

  return entryPointDirname != null ? entryPointDirname.toString() : null
}
