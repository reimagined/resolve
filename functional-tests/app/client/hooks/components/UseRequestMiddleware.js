import React, { useState, useCallback } from 'react'
import { createRetryOnErrorMiddleware } from '@resolve-js/client'
import { useCommand, useQuery, useViewModel } from '@resolve-js/react-hooks'

const useRetryOnCommandErrorScenario = (runId) => {
  const scenarioId = `${runId}-retry-on-command-error`

  const [blockedCommandResult, setBlockedCommandResult] = useState('')

  const executeBlockedRetryOnErrorCommand = useCommand(
    {
      aggregateId: scenarioId,
      aggregateName: 'test-scenario',
      type: 'blockedRetryOnErrorMiddleware',
      payload: {},
    },
    {
      middleware: {
        error: [
          createRetryOnErrorMiddleware({
            attempts: 20,
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
  const unblock = useCommand(
    {
      aggregateId: scenarioId,
      aggregateName: 'test-scenario',
      type: 'unblockRetryOnErrorMiddleware',
      payload: {},
    },
    [scenarioId]
  )
  const executeRetryOnErrorClientScenario = useCallback(() => {
    executeBlockedRetryOnErrorCommand()
    setTimeout(() => unblock(), 800)
  }, [executeBlockedRetryOnErrorCommand, unblock])

  return {
    executeRetryOnErrorCommand: executeRetryOnErrorClientScenario,
    blockedCommandResult,
  }
}

const useRetryOnQueryErrorScenario = (runId) => {
  const scenarioId = `${runId}-retry-on-read-model-error`

  const [readModelOk, setReadModelOk] = useState(false)

  const requestBlockedReadModel = useQuery(
    {
      name: 'test-scenarios',
      resolver: 'retryOnErrorScenario',
      args: { scenarioId },
    },
    {
      middleware: {
        error: createRetryOnErrorMiddleware({
          attempts: 20,
          errors: [500],
          debug: true,
          period: 500,
        }),
      },
    },
    (error, result) => {
      if (error) {
        throw error
      }
      setReadModelOk(!result.data.blocked)
    },
    [scenarioId]
  )

  const executeScenario = useCommand(
    {
      aggregateId: scenarioId,
      aggregateName: 'test-scenario',
      type: 'executeRetryOnErrorMiddlewareReadModel',
      payload: {},
    },
    [scenarioId]
  )

  const unblock = useCommand(
    {
      aggregateId: scenarioId,
      aggregateName: 'test-scenario',
      type: 'unblockRetryOnErrorMiddleware',
      payload: {},
    },
    [scenarioId]
  )

  const executeRetryOnErrorReadModel = useCallback(() => {
    executeScenario()
    requestBlockedReadModel()
    setTimeout(() => unblock(), 600)
  }, [requestBlockedReadModel, unblock, executeScenario])

  return {
    executeRetryOnErrorReadModel,
    readModelOk,
  }
}

const useRetryOnViewModelErrorScenario = (runId) => {
  const scenarioId = `${runId}-retry-on-view-model-error`

  const [viewModelOk, setViewModelOk] = useState(false)

  const { connect, dispose } = useViewModel(
    'test-scenario-view-model',
    [scenarioId],
    {},
    (state) => {
      setViewModelOk(!state.blocked)
    },
    {
      middleware: {
        error: createRetryOnErrorMiddleware({
          attempts: 20,
          errors: [500],
          debug: true,
          period: 500,
        }),
      },
    }
  )

  const executeScenario = useCommand(
    {
      aggregateId: scenarioId,
      aggregateName: 'test-scenario',
      type: 'executeRetryOnErrorMiddlewareViewModel',
      payload: {},
    },
    [scenarioId]
  )

  const unblock = useCommand(
    {
      aggregateId: scenarioId,
      aggregateName: 'test-scenario',
      type: 'unblockRetryOnErrorMiddleware',
      payload: {},
    },
    [scenarioId]
  )

  const executeRetryOnErrorViewModel = useCallback(() => {
    executeScenario()
    connect()
    setTimeout(() => unblock(), 600)
    setTimeout(() => dispose(), 1500)
  }, [connect, dispose, unblock, executeScenario])

  return {
    viewModelOk,
    executeRetryOnErrorViewModel,
  }
}

const UseRequestMiddleware = ({
  match: {
    params: { id: runId },
  },
}) => {
  const {
    executeRetryOnErrorCommand,
    blockedCommandResult,
  } = useRetryOnCommandErrorScenario(runId)
  const {
    executeRetryOnErrorReadModel,
    readModelOk,
  } = useRetryOnQueryErrorScenario(runId)
  const {
    executeRetryOnErrorViewModel,
    viewModelOk,
  } = useRetryOnViewModelErrorScenario(runId)

  return (
    <div>
      <h4>{`Test run id: ${runId}`}</h4>
      <div>
        <button
          style={{ display: 'inline-block' }}
          onClick={executeRetryOnErrorCommand}
        >
          Retry on error: useCommand
        </button>
        <div style={{ display: 'inline-block' }}>{blockedCommandResult}</div>
      </div>
      <div>
        <button
          style={{ display: 'inline-block' }}
          onClick={executeRetryOnErrorReadModel}
        >
          Retry on error: useQuery
        </button>
        <div style={{ display: 'inline-block' }}>
          {readModelOk ? 'test ok' : 'testing'}
        </div>
      </div>
      <div>
        <button
          style={{ display: 'inline-block' }}
          onClick={executeRetryOnErrorViewModel}
        >
          Retry on error: useViewModel
        </button>
        <div style={{ display: 'inline-block' }}>
          {viewModelOk ? 'test ok' : 'testing'}
        </div>
      </div>
    </div>
  )
}

export { UseRequestMiddleware }
