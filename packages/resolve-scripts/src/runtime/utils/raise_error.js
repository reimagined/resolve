import println from './println'

// TODO

const raiseError = errorText => {
  println.error('Error: ', errorText)
  process.exit(1)
}

export default raiseError
