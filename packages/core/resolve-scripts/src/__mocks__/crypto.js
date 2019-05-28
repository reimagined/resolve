const crypto = {
  createHmac: (algorithm, prefix) => {
    return {
      update() {},
      digest(mode) {
        return `${algorithm}:${prefix}:${mode}`
      }
    }
  }
}

export default crypto
