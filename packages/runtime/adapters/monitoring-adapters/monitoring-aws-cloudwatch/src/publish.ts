import CloudWatch from 'aws-sdk/clients/cloudwatch'
import { LeveledDebugger } from '@resolve-js/debug-levels'
import { retry } from 'resolve-cloud-common/utils'
import { MAX_METRIC_COUNT } from './constants'
import {
  MonitoringData,
} from './types'

export const monitoringPublish = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData
) => {
  try {
    log.verbose(`Sending ${monitoringData.metricData.length} metrics`)
    log.verbose(JSON.stringify(monitoringData.metricData))

    const promises = []

    const cw = new CloudWatch()
    const putMetricData = retry(cw, cw.putMetricData)

    for (
      let i = 0;
      i < monitoringData.metricData.length;
      i += MAX_METRIC_COUNT
    ) {
      promises.push(
        putMetricData({
          Namespace: 'ResolveJs',
          MetricData: monitoringData.metricData.slice(i, i + MAX_METRIC_COUNT),
        })
      )
    }

    monitoringData.metricData = []

    await Promise.all(promises)

    log.verbose(`Metrics data sent`)
  } catch (e) {
    log.warn(`Metrics data sending failed: ${e}`)
  }
}
