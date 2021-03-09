import wrapApiHandler from './wrap-api-handler'

const pause = async (req, res) => {
  const { eventSubscriber } = req.query
  try {
    await req.resolve.eventSubscriber.pause({ eventSubscriber })
    res.end(`EventSubscriber = "${eventSubscriber}" paused`)
  } catch (e) {
    res.end(`EventSubscriber "${eventSubscriber}" does not exist`)
  }
}

export default wrapApiHandler(pause)
