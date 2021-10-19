import type { WrapWithCloneArgsMethod, FunctionLike, JsonLike } from './types'

const deepClone = <T extends JsonLike | undefined>(value: T): T =>
  ((value !== undefined
    ? JSON.parse(JSON.stringify(value))
    : undefined) as unknown) as T

const wrapWithCloneArgs: WrapWithCloneArgsMethod = <T extends FunctionLike>(
  fn: T
): T =>
  (((...args: Parameters<T>): ReturnType<T> =>
    fn(...args.map((arg) => deepClone(arg)))) as unknown) as T

export default wrapWithCloneArgs
