import React, { useState, useContext } from 'react'

import { useSubscription, ResolveContext } from 'resolve-hooks'

const viewModelName = 'myViewModel'

const Test = ({ aggregateId }) => {
  const [eventsCount, setEventsCount] = useState(0)
  const [subscribed, setSubscribed] = useState(false)

  // const context = useContext(ResolveContext)

  const handleEvent = event => {
    console.log('event', event)
    setEventsCount(prevCount => prevCount + 1)
  }

  const handleSubscribe = (err, subscription) => {
    console.log('subscribed', err, subscription)
    setSubscribed(true)
  }

  const handleResubscribe = () => {
    console.log('resubscribed')
    setSubscribed(true)
  }

  useSubscription(
    viewModelName,
    aggregateId === '*' ? '*' : [aggregateId],
    handleEvent,
    handleSubscribe,
    handleResubscribe
  )

  return (
    <React.Fragment>
      <div>{subscribed ? 'online' : 'offline'}</div>
      <div>{eventsCount}</div>
    </React.Fragment>
  )
}

export default Test
