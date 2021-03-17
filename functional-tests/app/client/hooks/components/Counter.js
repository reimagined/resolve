import React, { useState, useEffect } from 'react'
import { useViewModel, useCommand } from '@resolve-js/react-hooks'

const Counter = ({
  match: {
    params: { id: aggregateId },
  },
}) => {
  if (!aggregateId) {
    throw Error(`use counter/counter-id path to run tests`)
  }

  const [counter, setCounter] = useState(0)
  const [eventCounter, setEventCounter] = useState(0)
  const [lastEvent, setLastEvent] = useState('')

  const { connect, dispose } = useViewModel(
    'counter',
    [aggregateId],
    {},
    setCounter,
    (event) => {
      setEventCounter(eventCounter + 1)
      setLastEvent(JSON.stringify(event, null, 2))
    }
  )

  const increaseCounter = useCommand({
    type: 'increase',
    aggregateId,
    aggregateName: 'Counter',
    payload: counter,
  })

  const decreaseCounter = useCommand({
    type: 'decrease',
    aggregateId,
    aggregateName: 'Counter',
    payload: counter,
  })

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div>
      <h4>{`Counter aggregate id: ${aggregateId}`}</h4>
      <button onClick={increaseCounter}>+</button>
      <div id="counter">{counter}</div>
      <button onClick={decreaseCounter}>-</button>
      <div id="eventCounter">{eventCounter}</div>
      <div id="lastEvent">
        <pre>{lastEvent}</pre>
      </div>
    </div>
  )
}

export { Counter }
