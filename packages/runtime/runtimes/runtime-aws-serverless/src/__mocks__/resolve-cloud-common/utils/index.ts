export const retry = jest.fn((context, method) => method.bind(context))
export const getAccountIdFromLambdaContext = jest.fn(() => 'account-id')
