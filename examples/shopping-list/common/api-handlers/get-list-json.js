import fetch from 'isomorphic-fetch'

const controller = async (req, res) => {
  const defaultReadModelUrl = `http://${req.headers.host}${
    req.resolve.rootPath
  }/api/query/Default/shoppingLists`

  const request = await fetch(defaultReadModelUrl)
  const content = await request.json()
  res.json(content)
}

export default controller
