export function defaultAssertion<TResult>(
  resolve: (result: TResult | null) => void,
  reject: (error: Error) => void,
  result: TResult | null,
  error: any
): void {
  if (error != null) {
    reject(error)
  } else {
    resolve(result)
  }
}
