import {
  USER_PERSONAL_DATA_REQUESTED,
  USER_PROFILE_DELETED
} from '../user-profile.events'
import { systemToken } from '../jwt'

const saga = {
  [USER_PERSONAL_DATA_REQUESTED]: async (
    { sideEffects },
    event
  ): Promise<void> => {
    // TODO: gather all data, make a zip with report and upload it to where?
    const { aggregateId: userId } = event

    const profile = await sideEffects.executeQuery({
      modelName: 'user-profiles',
      modelArgs: {
        userId
      },
      jwt: systemToken()
    })

    // upload
    const archiveId = 'todo'

    await sideEffects.executeCommand({
      type: 'completePersonalDataGathering',
      aggregateName: 'user-profile',
      aggregateId: userId,
      payload: {
        archiveId
      }
    })
  },
  [USER_PROFILE_DELETED]: async ({ sideEffects }, event): Promise<void> => {
    await sideEffects.forget(event.aggregateId)
  }
}
