import createLogger, { LoggerWithLevels } from 'resolve-debug-levels'

function getLog(scope:string): LoggerWithLevels {
  return createLogger(`resolve:event-store-base:${scope}`)
}

export default getLog
