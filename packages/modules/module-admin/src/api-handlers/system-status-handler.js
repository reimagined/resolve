import wrapApiHandler from './wrap-api-handler'

const systemHandler = async (req, res) => {
  res.end(`ready`)
}

export default wrapApiHandler(systemHandler)
