import React, { useState, useEffect } from 'react'
import { useViewModel, useCommand } from 'resolve-react-hooks'

const aggregateId = 'counter-aggregate-id'

const Counter = () => {
  const [counter, setCounter] = useState(0)

  const { connect, dispose } = useViewModel(
    'counter',
    [aggregateId],
    setCounter
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
      <button onClick={increaseCounter}>+</button>
      <div id="counter">{counter}</div>
      <button onClick={decreaseCounter}>-</button>
    </div>
  )
}

export default Counter
