export default async (req, res) => {
  const status = await req.resolve.requestListenerInformation(
    req.query.listenerId
  )
  res.json(status)
}
