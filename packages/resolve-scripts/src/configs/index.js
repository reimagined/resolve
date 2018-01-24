import path from 'path'

export const DIST_PATH = path.join(process.cwd(), './dist')
export const DEV_STATIC_PATH = path.join(process.cwd(), './static')
export const PROD_STATIC_PATH = path.join(DIST_PATH, './static')
