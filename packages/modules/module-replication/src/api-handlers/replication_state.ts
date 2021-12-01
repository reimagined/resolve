import type {
  ResolveRequest,
  ResolveResponse,
  ReplicationState,
} from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  try {
    const result: ReplicationState & {
      totalEventCount?: number
      totalSecretCount?: number
    } = await req.resolve.eventstoreAdapter.getReplicationState()
    if (req.query['extra'] !== undefined) {
      const description = await req.resolve.eventstoreAdapter.describe()
      result.totalEventCount = description.eventCount
      result.totalSecretCount = description.secretCount
    }
    res.json(result)
  } catch (error) {
    const result: ReplicationState = {
      statusAndData: {
        status: 'serviceError',
        data: {
          name: error.name,
          message: error.message,
        },
      },
      iterator: null,
      successEvent: null,
      paused: false,
      locked: false,
    }
    res.json(result)
  }
}

export default handler
