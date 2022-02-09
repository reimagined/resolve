const getSafeErrorMessage = (error: Error) => {
  return `${error?.name ?? 'Error'}: ${error?.message ?? 'unknown'}`
}

export default getSafeErrorMessage
