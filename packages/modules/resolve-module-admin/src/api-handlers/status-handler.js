import wrapApiHandler from './wrap-api-handler'

const pause = async (req, res) => {
  res.end(`enabled`)
}

export default wrapApiHandler(pause)
