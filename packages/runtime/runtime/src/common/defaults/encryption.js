export default () => ({
  encrypt: () => {
    throw Error(`encryption disabled, please check your configuration`)
  },
  decrypt: () => {
    throw Error(`encryption disabled, please check your configuration`)
  },
})
