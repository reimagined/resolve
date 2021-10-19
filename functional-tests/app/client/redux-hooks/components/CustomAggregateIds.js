// https://github.com/reimagined/resolve/issues/1874
import React, { useEffect } from 'react'
import { useReduxViewModel, useReduxCommand } from '@resolve-js/redux'
import { useSelector } from 'react-redux'

const CustomAggregateIds = ({
  match: {
    params: { testId },
  },
}) => {
  const targetAggregateId = `${testId}-target`

  const { connect, dispose, selector } = useReduxViewModel({
    name: 'custom-aggregate-ids',
    aggregateIds: [testId],
    args: {},
  })

  const { data: counter } = useSelector(selector)

  const { execute: increase } = useReduxCommand({
    type: 'increase',
    aggregateName: 'Counter',
    aggregateId: targetAggregateId,
    payload: {},
  })

  useEffect(() => {
    connect()
    return dispose
  }, [])

  return (
    <div>
      <button onClick={increase}>increase</button>
      <div id="counter">{counter}</div>
    </div>
  )
}

export { CustomAggregateIds }
