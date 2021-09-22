import { getErrorMessage } from './get-error-message'

export const createErrorDimensionsList = (error: Error) => [
  [
    { Name: 'ErrorName', Value: error.name },
    { Name: 'ErrorMessage', Value: getErrorMessage(error) },
  ],
  [{ Name: 'ErrorName', Value: error.name }],
  [],
]
