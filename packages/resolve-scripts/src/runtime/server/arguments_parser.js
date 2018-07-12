const argumentsParser = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).end()
    return
  }

  req.arguments = req[req.method === 'POST' ? 'body' : 'query']
  next()
}

export default argumentsParser
