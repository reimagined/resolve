import React, { useEffect, useState } from 'react'
import { useCommandBuilder, useReadModelChannel } from '@resolve-js/react-hooks'

const ReadModelChannel = ({
  match: {
    params: { id: scenarioId },
  },
}) => {
  if (!scenarioId) {
    throw Error(`use read-model-channel/:id path to run tests`)
  }

  const [message, setMessage] = useState('')

  const { connect, dispose } = useReadModelChannel(
    {
      name: 'test-scenarios',
      resolver: 'reactiveChannelScenario',
      args: {
        scenarioId,
      },
    },
    [],
    (notification) => setMessage(notification)
  )

  const publish = useCommandBuilder((echo) => ({
    type: 'publishToReactiveChannel',
    aggregateId: scenarioId,
    aggregateName: 'test-scenario',
    payload: {
      echo,
    },
  }))

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div>
      <h4>{`Read model channel test scenario: ${scenarioId}`}</h4>
      <button onClick={() => publish('Reactive Hello!')}>publish</button>
      <h3>{message}</h3>
    </div>
  )
}

export { ReadModelChannel }
