export default (): any => {
  const secrets = new Map<string, string>()
  return {
    getSecret: async (id: string): Promise<string | undefined> =>
      Promise.resolve(secrets.get(id)),
    setSecret: async (id: string, secret: string): Promise<void> => {
      secrets.set(id, secret)
      return Promise.resolve()
    },
    deleteSecret: async (id: string): Promise<boolean> =>
      Promise.resolve(secrets.delete(id)),
  }
}
