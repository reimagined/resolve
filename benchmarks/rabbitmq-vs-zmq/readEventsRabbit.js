import rabbitmqAdapter from 'resolve-bus-rabbitmq'

import config from './config'

const busRabbitmq = rabbitmqAdapter({
  url: config.RABBITMQ_CONNECTION_URL,
  messageTtl: 20000
})

let eventsLeft = process.argv[2]
let lastEventsReported

busRabbitmq.subscribe(() => --eventsLeft)

function doneHandler() {
  if (eventsLeft <= 0 || lastEventsReported === eventsLeft) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        consumedEvents: process.argv[2] - eventsLeft,
        memory: process.memoryUsage()
      })
    )
    process.exit()
  }

  lastEventsReported = eventsLeft
  setTimeout(doneHandler, 250)
}

setTimeout(doneHandler, 250)
