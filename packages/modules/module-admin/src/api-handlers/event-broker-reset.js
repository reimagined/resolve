import wrapApiHandler from './wrap-api-handler'

const reset = async (req, res) => {
  const { eventSubscriber } = req.query
  try {
    await req.resolve.eventSubscriber.reset({ eventSubscriber })
    await req.resolve.eventSubscriber.resume({ eventSubscriber })
    res.end(`EventSubscriber = "${eventSubscriber}" reset`)
  } catch (e) {
    res.end(`EventSubscriber "${eventSubscriber}" does not exist`)
  }
}

export default wrapApiHandler(reset)
