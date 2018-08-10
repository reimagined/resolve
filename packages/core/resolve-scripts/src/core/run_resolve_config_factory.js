import importBabel from './import_babel'
import resolveFile from './resolve_file'

const path = resolveFile('resolve.config.js')
importBabel(path)
