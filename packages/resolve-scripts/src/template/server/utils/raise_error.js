import getSourceInfo from './get_source_info'

const raiseError = (errorText, errorObject) => {
  const errorSource =
    typeof errorObject !== 'undefined' ? getSourceInfo(errorObject) : ''
  // eslint-disable-next-line no-console
  console.error('Error: ', errorText, ' ', errorSource)
  process.exit(1)
}

export default raiseError
