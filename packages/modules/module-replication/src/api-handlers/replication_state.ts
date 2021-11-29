import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  const result: any = await req.resolve.eventstoreAdapter.getReplicationState()
  if (req.query['extra'] !== undefined) {
    const description = await req.resolve.eventstoreAdapter.describe()
    result.totalEventCount = description.eventCount
    result.totalSecretCount = description.secretCount
  }
  res.json(result)
}

export default handler
