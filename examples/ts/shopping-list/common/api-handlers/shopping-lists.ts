import fetch from 'isomorphic-fetch'

const handler = async (req: any, res: any) => {
  const defaultReadModelUrl = `http://${req.headers.host}${req.resolve.rootPath}/api/query/ShoppingLists/all`

  const request = await fetch(defaultReadModelUrl)
  const content = await request.json()
  res.json(content)
}

export default handler
