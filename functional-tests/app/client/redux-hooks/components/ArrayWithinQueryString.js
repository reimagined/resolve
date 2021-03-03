import React from 'react'
import { useSelector } from 'react-redux'
import { useReduxReadModel, useReduxCommand } from '@resolve-js/redux'

const ArrayWithQueryString = ({
  match: {
    params: { runId },
  },
}) => {
  const scenario0 = `${runId}0`
  const scenario1 = `${runId}1`
  const scenario2 = `${runId}2`

  const { execute: addScenario } = useReduxCommand((aggregateId) => ({
    type: 'executeArrayWithingQueryString',
    aggregateName: 'test-scenario',
    aggregateId,
    payload: {},
  }))

  const {
    request: getScenariosDefault,
    selector: defaultSelector,
  } = useReduxReadModel(
    {
      name: 'test-scenarios',
      resolver: 'arrayWithinQueryStringScenario',
      args: {
        scenarioIds: [scenario0, scenario1, scenario2],
      },
    },
    {
      requested: [],
      result: [],
    },
    { selectorId: 'selector-default' },
    []
  )

  const {
    request: getScenariosNone,
    selector: noneSelector,
  } = useReduxReadModel(
    {
      name: 'test-scenarios',
      resolver: 'arrayWithinQueryStringScenario',
      args: {
        scenarioIds: [scenario0, scenario1, scenario2],
      },
    },
    {
      requested: [],
      result: [],
    },
    {
      queryOptions: { queryStringOptions: { arrayFormat: 'none' } },
      selectorId: 'selector-none',
    },
    []
  )

  const { data: byDefault } = useSelector(defaultSelector)
  const { data: byNone } = useSelector(noneSelector)

  return (
    <div>
      <button onClick={() => addScenario(scenario0)}>make scenario 0</button>
      <button onClick={() => addScenario(scenario1)}>make scenario 1</button>
      <button onClick={() => addScenario(scenario2)}>make scenario 2</button>
      <br />
      <button onClick={getScenariosDefault}>retrieve all with defaults</button>
      <button onClick={getScenariosNone}>
        retrieve all with query string none
      </button>
      <br />
      <div id="scenarios-default">{`${byDefault.requested.length}-${byDefault.result.length}`}</div>
      <div id="scenarios-none">{`${byNone.requested.length}-${byNone.result.length}`}</div>
    </div>
  )
}

export { ArrayWithQueryString }
