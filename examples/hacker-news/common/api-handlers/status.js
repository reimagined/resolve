export default async (req, res) => {
  const status = await req.resolve.requestReadModelInformation(
    req.query.listenerId
  )
  res.json(status)
}
