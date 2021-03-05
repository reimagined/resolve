import wrapApiHandler from './wrap-api-handler'

const systemStatusHandler = async (req, res) => {
  res.end(`ready`)
}

export default wrapApiHandler(systemStatusHandler)
