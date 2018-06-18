const validator = (_, jwtToken) => {
  if (!jwtToken) {
    throw new Error()
  }
}

export default validator
