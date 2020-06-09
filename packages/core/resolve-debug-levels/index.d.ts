declare type Logger = (msg: string) => void
declare type Levels = {
  log: Logger
  error: Logger
  warn: Logger
  debug: Logger
  info: Logger
  verbose: Logger
}
export declare type LoggerWithLevels = Logger & Levels

declare function DefaultLogger (namespace: string): LoggerWithLevels
export default DefaultLogger
