// @flow

declare module 'seamless-immutable' {
  declare export type Immutable<T: Object | Array<*>> = T & {}

  declare export function from<T: Object | Array<*>>(val: T): Immutable<T>

  declare export default typeof from
}
