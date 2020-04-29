import { Saga } from 'resolve-core'
import uuid from 'uuid/v4'

import {
  USER_PERSONAL_DATA_REQUESTED,
  USER_PROFILE_DELETED
} from '../user-profile.events'
import { systemToken } from '../jwt'

const saga: Saga = {
  handlers: {
    [USER_PERSONAL_DATA_REQUESTED]: async (context, event): Promise<void> => {
      // TODO: gather all data, make a zip with report and upload it to where?
      const { aggregateId: userId } = event
      const { sideEffects } = context

      const profile = await sideEffects.executeQuery({
        modelName: 'user-profiles',
        resolverName: 'profile',
        resolverArgs: { userId },
        jwtToken: systemToken()
      })

      const posts = await sideEffects.executeQuery({
        modelName: 'blog-posts',
        resolverName: 'feedByAuthor',
        resolverArgs: { authorId: userId },
        jwtToken: systemToken()
      })

      const media = await sideEffects.executeQuery({
        modelName: 'medias',
        resolverName: 'byOwner',
        resolverArgs: { ownerId: userId },
        jwtToken: systemToken()
      })

      const archiveId = uuid()

      const archive = { id: archiveId, profile, posts, media }
      // TODO: upload archive
      console.log(archive)

      await sideEffects.executeCommand({
        type: 'completePersonalDataGathering',
        aggregateName: 'user-profile',
        aggregateId: userId,
        payload: {
          archiveId
        },
        jwtToken: systemToken()
      })
    },
    [USER_PROFILE_DELETED]: async ({ sideEffects }, event): Promise<void> => {
      await sideEffects.secretsManager.deleteSecret(event.aggregateId)
    }
  }
}

export default saga
