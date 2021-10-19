import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  const { events } = await req.resolve.eventstoreAdapter.loadEvents({
    limit: 2000,
    cursor: null,
  })
  res.json({ eventsCount: events.length })
}

export default handler
