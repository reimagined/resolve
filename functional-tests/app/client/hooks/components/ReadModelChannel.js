import React, { useEffect } from 'react'
import { useReadModelChannel } from '@resolve-js/react-hooks'

const ReadModelChannel = ({
  match: {
    params: { id: scenarioId },
  },
}) => {
  if (!scenarioId) {
    throw Error(`use read-model-channel/:id path to run tests`)
  }

  const { connect, dispose } = useReadModelChannel(
    {
      name: 'test-scenarios',
      resolver: 'reactiveChannelScenario',
      args: {
        scenarioId,
      },
    },
    [],
    (notification) => {
      console.log(notification)
    }
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div>
      <h4>{`Read model channel test scenario: ${scenarioId}`}</h4>
    </div>
  )
}

export { ReadModelChannel }
