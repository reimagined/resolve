const validator = (_, jwt) => {
  if (!jwt) {
    throw new Error()
  }
}

export default validator
