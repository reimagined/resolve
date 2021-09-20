export const lambdaGuard = async () => {
  throw new Error(
    'Self-contained process, probably, was executed in serverless environment'
  )
}
