import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  const result = await req.resolve.eventstoreAdapter.getReplicationState()
  const description = await req.resolve.eventstoreAdapter.describe()
  res.json({
    ...result,
    totalEventCount: description.eventCount,
    totalSecretCount: description.secretCount,
  })
}

export default handler
