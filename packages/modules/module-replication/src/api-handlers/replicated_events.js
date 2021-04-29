const handler = async (req, res) => {
  const { events } = await req.resolve.eventstoreAdapter.loadEvents({
    limit: 2000,
    cursor: null,
  })
  res.json({ eventsCount: events.length })
}

export default handler
