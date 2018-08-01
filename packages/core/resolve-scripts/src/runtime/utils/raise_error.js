import println from './println'

const raiseError = errorText => {
  println.error('Error: ', errorText)
  process.exit(1)
}

export default raiseError
