export const disabledEncryption = () => ({
  encrypt: () => {
    throw Error(`encryption disabled, please check your configuration`)
  },
  decrypt: () => {
    throw Error(`encryption disabled, please check your configuration`)
  },
})
