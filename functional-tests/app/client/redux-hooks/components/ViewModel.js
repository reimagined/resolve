import React, { useEffect } from 'react'
import { useReduxViewModel, useReduxCommand } from '@resolve-js/redux'
import { counterIncrement, counterStateUpdate } from '../custom-actions'
import { useSelector } from 'react-redux'

const BasicViewModelTests = ({
  match: {
    params: { runId },
  },
}) => {
  const counterId = `counter-${runId}`

  const { connect, dispose } = useReduxViewModel(
    {
      name: 'counter',
      aggregateIds: [counterId],
      args: {},
    },
    {
      actions: {
        stateUpdate: (query, state, initial) =>
          counterStateUpdate(counterId, state, initial),
        eventReceived: () => counterIncrement(counterId),
      },
    }
  )

  const { execute: increase } = useReduxCommand({
    type: 'increase',
    aggregateName: 'Counter',
    aggregateId: counterId,
    payload: {},
  })

  const { byEvents = 0, byState = 0 } =
    useSelector((state) => state.customCounter[counterId]) || {}

  useEffect(() => {
    connect()
    return dispose
  }, [])

  return (
    <div>
      <button onClick={increase}>Increase</button>
      <div id="byEvents">{byEvents}</div>
      <div id="byState">{byState}</div>
    </div>
  )
}

export { BasicViewModelTests }
