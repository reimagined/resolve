import fetch from 'isomorphic-fetch'

const controller = async (req, res) => {
  const defaultReadModelUrl = `${req.protocol}://${req.host}${
    req.resolveApiPath
  }/query/Default/shoppingLists`

  const request = await fetch(defaultReadModelUrl)
  const content = await request.json()
  res.json(content)
}

export default controller
