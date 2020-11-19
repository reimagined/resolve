import React, { useState, useCallback } from 'react'
import { createRetryOnErrorMiddleware } from 'resolve-client'
import { useCommand } from 'resolve-react-hooks'

const UseRequestMiddleware = ({
  match: {
    params: { id: scenarioId },
  },
}) => {
  const [blockedCommandResult, setBlockedCommandResult] = useState('')

  const executeBlockedRetryOnErrorCommand = useCommand(
    {
      aggregateId: `${scenarioId}-retry-on-command-error`,
      aggregateName: 'test-scenario',
      type: 'blockedRetryOnErrorMiddleware',
      payload: {},
    },
    {
      middleware: {
        error: [
          createRetryOnErrorMiddleware({
            attempts: 3,
            errors: [500],
            debug: true,
            period: 500,
          }),
        ],
      },
    },
    (error, result) => {
      if (error) {
        setBlockedCommandResult(error.message)
      }
      setBlockedCommandResult(result.type)
    },
    [scenarioId]
  )
  const executeUnblockRetryOnErrorCommand = useCommand(
    {
      aggregateId: `${scenarioId}-retry-on-command-error`,
      aggregateName: 'test-scenario',
      type: 'unblockRetryOnErrorMiddleware',
      payload: {},
    },
    [scenarioId]
  )
  const executeRetryOnErrorClientScenario = useCallback(() => {
    executeBlockedRetryOnErrorCommand()
    setTimeout(() => executeUnblockRetryOnErrorCommand(), 800)
  }, [executeBlockedRetryOnErrorCommand, executeUnblockRetryOnErrorCommand])

  return (
    <div>
      <h4>{`Test scenario id: ${scenarioId}`}</h4>
      <div>
        <button
          style={{ display: 'inline-block' }}
          onClick={executeRetryOnErrorClientScenario}
        >
          Execute retry on error scenario
        </button>
        <div style={{ display: 'inline-block' }}>{blockedCommandResult}</div>
      </div>
    </div>
  )
}

export { UseRequestMiddleware }
