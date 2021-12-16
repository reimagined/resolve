import { getLog as getBaseLog } from '@resolve-js/runtime-base'

export const getLog = (name: string) => getBaseLog(`scheduler:${name}`)
