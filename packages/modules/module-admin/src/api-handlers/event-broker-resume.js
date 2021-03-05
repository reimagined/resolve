import wrapApiHandler from './wrap-api-handler'

const resume = async (req, res) => {
  const { eventSubscriber } = req.query
  try {
    await req.resolve.eventSubscriber.resume({ eventSubscriber })
    res.end(`EventSubscriber = "${eventSubscriber}" running`)
  } catch (e) {
    res.end(`EventSubscriber "${eventSubscriber}" does not exist`)
  }
}

export default wrapApiHandler(resume)
