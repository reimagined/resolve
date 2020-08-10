const isHighloadError = error =>
  error != null &&
  (/Request timed out/i.test(error.message) ||
    /Remaining connection slots are reserved/i.test(error.message) ||
    /I\/O error occurr?ed/i.test(error.message) ||
    /too many clients already/i.test(error.message) ||
    /in a read-only transaction/i.test(error.message) ||
    error.code === 'ProvisionedThroughputExceededException' ||
    error.code === 'LimitExceededException' ||
    error.code === 'RequestLimitExceeded' ||
    error.code === 'ThrottlingException' ||
    error.code === 'TooManyRequestsException' ||
    error.code === 'NetworkingError')

export default isHighloadError
