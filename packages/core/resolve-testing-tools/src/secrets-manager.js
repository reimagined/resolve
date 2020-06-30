export default () => {
  const secrets = new Map()
  return {
    getSecret: async id => secrets.get(id),
    setSecret: async (id, secret) => secrets.setSecret(id, secret),
    deleteSecret: async id => secrets.delete(id)
  }
}
