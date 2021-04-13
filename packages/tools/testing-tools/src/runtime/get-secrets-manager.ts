import { SecretsManager } from '@resolve-js/core'

export const getSecretsManager = (): SecretsManager => {
  const secrets = new Map<string, string>()
  return {
    getSecret: async (id: string): Promise<string | null> => {
      return secrets.get(id) || null
    },
    setSecret: async (id: string, secret: string): Promise<void> => {
      secrets.set(id, secret)
    },
    deleteSecret: async (id: string): Promise<void> => {
      secrets.delete(id)
    },
  }
}
