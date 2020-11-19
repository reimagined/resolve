import React from 'react'
import { useViewModel, useCommand } from 'resolve-react-hooks'

const UseRequestMiddleware = ({
  match: {
    params: { id: scenarioId },
  },
}) => {
  const beginScenario = useCommand({
    aggregateId: scenarioId,
    aggregateName: 'test-scenario',
    type: 'beginRequestMiddleware',
    payload: {},
  })

  return (
    <div>
      <h4>{`Test scenario id: ${scenarioId}`}</h4>
      <button onClick={increaseCounter}>+</button>
      <div id="counter">{counter}</div>
      <button onClick={decreaseCounter}>-</button>
    </div>
  )
}

export { UseRequestMiddleware }
