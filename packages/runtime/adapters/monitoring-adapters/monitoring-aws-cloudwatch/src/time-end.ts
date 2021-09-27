import { LeveledDebugger } from '@resolve-js/debug-levels'
import { monitoringDuration } from './duration'
import { MonitoringData, MonitoringGroupData } from './types'

export const monitoringTimeEnd = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData,
  label: string,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${label}' is not ended because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupData.timerMap[label] === 'number') {
    const duration = timestamp - groupData.timerMap[label]
    return monitoringDuration(log, monitoringData, groupData, label, duration)
  } else {
    log.warn(`Timer '${label}' does not exist`)
  }
}
