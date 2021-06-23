const makeDefaultEncryption = () => ({
  encrypt: () => {
    throw Error(`encryption disabled, please check your configuration`)
  },
  decrypt: () => {
    throw Error(`encryption disabled, please check your configuration`)
  },
})

export default makeDefaultEncryption
