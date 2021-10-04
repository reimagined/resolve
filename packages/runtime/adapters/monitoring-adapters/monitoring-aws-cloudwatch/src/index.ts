import { LeveledDebugger } from '@resolve-js/debug-levels'
import createBaseMonitoring from '@resolve-js/monitoring-base'

import {
  MonitoringData,
  MonitoringGroupData,
  MonitoringDimensionsList,
} from './types'

import { getLog } from './get-log'
import { monitoringDuration } from './duration'
import { monitoringError } from './error'
import { monitoringExecution } from './execution'
import { monitoringTime } from './time'
import { monitoringTimeEnd } from './time-end'
import { monitoringPublish } from './publish'
import { createGroupDimensions } from './create-group-dimension'
import { monitoringRate } from './rate'
import { createDeploymentDimensions } from './create-deployment-dimension'

const createMonitoringImplementation = (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData
) => {
  return {
    group: (config: Record<string, string>) => {
      const groupDimensions = createGroupDimensions(config)

      const globalDimensions: MonitoringDimensionsList =
        config.Part != null ? [[{ Name: 'Part', Value: config.Part }]] : []

      const nextGroupData = {
        timerMap: {},
        globalDimensions: groupData.globalDimensions.concat(globalDimensions),
        metricDimensions: groupData.metricDimensions.concat(groupDimensions),
        durationMetricDimensionsList: groupData.durationMetricDimensionsList.map(
          (dimensions) => [...dimensions, ...groupDimensions]
        ),
        errorMetricDimensionsList: [
          ...groupData.errorMetricDimensionsList,
          groupData.errorMetricDimensionsList[
            groupData.errorMetricDimensionsList.length - 1
          ].concat(groupDimensions),
        ],
      }

      return createMonitoringImplementation(log, monitoringData, nextGroupData)
    },
    error: monitoringError.bind(null, log, monitoringData, groupData),
    execution: monitoringExecution.bind(null, log, monitoringData, groupData),
    duration: monitoringDuration.bind(null, log, monitoringData, groupData),
    time: monitoringTime.bind(null, log, monitoringData, groupData),
    timeEnd: monitoringTimeEnd.bind(null, log, monitoringData, groupData),
    rate: monitoringRate.bind(null, log, monitoringData, groupData),
    publish: monitoringPublish.bind(null, log, monitoringData),
  }
}

const createMonitoring = ({
  deploymentId,
  resolveVersion,
}: {
  deploymentId: string
  resolveVersion: string
}) => {
  const monitoringData: MonitoringData = {
    monitoringBase: createBaseMonitoring(),
    metricData: [],
    metricDimensions: createDeploymentDimensions(deploymentId, resolveVersion),
  }

  const monitoringGroupData: MonitoringGroupData = {
    timerMap: {},
    metricDimensions: [],
    globalDimensions: [],
    durationMetricDimensionsList: [
      [
        { Name: 'DeploymentId', Value: deploymentId },
        { Name: 'ResolveVersion', Value: resolveVersion },
      ],
      [{ Name: 'ResolveVersion', Value: resolveVersion }],
      [{ Name: 'DeploymentId', Value: deploymentId }],
    ],
    errorMetricDimensionsList: [
      [{ Name: 'DeploymentId', Value: deploymentId }],
    ],
  }

  return createMonitoringImplementation(
    getLog('monitoring'),
    monitoringData,
    monitoringGroupData
  )
}

export default createMonitoring
