import { LeveledDebugger } from '@resolve-js/debug-levels'
import {
  MonitoringData,
  MonitoringGroupData,
} from './types'

export const monitoringTime = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData,
  label: string,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${label}' is not started because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupData.timerMap[label] !== 'number') {
    groupData.timerMap[label] = timestamp
  } else {
    log.warn(`Timer '${label}' already exists`)
  }
}
