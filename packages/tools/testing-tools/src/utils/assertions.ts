export function defaultAssertion<TResult>(
  resolve: (result: TResult) => void,
  reject: (error: Error) => void,
  result: TResult,
  error: any
): void {
  if (error != null) {
    reject(error)
  } else {
    resolve(result)
  }
}
