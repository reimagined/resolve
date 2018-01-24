import fs from 'fs-extra'
import { DIST_PATH } from '../configs'

fs.removeSync(DIST_PATH)
