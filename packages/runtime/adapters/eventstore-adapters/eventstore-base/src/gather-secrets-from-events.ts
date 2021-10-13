import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  StoredEvent,
  GatheredSecrets,
  SecretRecord,
} from './types'
import { DELETE_SECRET_EVENT_TYPE, SET_SECRET_EVENT_TYPE } from './secret-event'

const gatherSecretsFromEvents = async <
  ConnectedProps extends AdapterPoolConnectedProps
>(
  pool: AdapterPoolConnected<ConnectedProps>,
  events: StoredEvent[]
): Promise<GatheredSecrets> => {
  if (pool.loadSecrets === undefined)
    throw new Error('loadSecrets is not defined for this adapter')

  const existingSecretsIds: Array<SecretRecord['id']> = []
  const deletedSecrets: Array<SecretRecord['id']> = []

  for (const event of events) {
    if (event.type === SET_SECRET_EVENT_TYPE) {
      existingSecretsIds.push(event.payload.id)
    } else if (event.type === DELETE_SECRET_EVENT_TYPE) {
      deletedSecrets.push(event.payload.id)
    }
  }

  const { secrets } = await pool.loadSecrets({
    limit: existingSecretsIds.length,
    ids: existingSecretsIds,
    includeDeleted: true,
  })

  return { deletedSecrets, existingSecrets: secrets }
}

export default gatherSecretsFromEvents
