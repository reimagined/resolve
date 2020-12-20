export type RunQuery = (
  sql: string,
  multiLine?: boolean,
  passthroughRuntimeErrors?: boolean
) => Promise<any>

