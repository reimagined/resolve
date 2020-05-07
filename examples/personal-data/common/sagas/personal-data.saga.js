import uuid from 'uuid/v4'
import fs from 'fs'
import fetch from 'node-fetch'

import {
  USER_PERSONAL_DATA_REQUESTED,
  USER_PROFILE_DELETED
} from '../user-profile.events'
import { systemToken } from '../jwt'

const saga = {
  handlers: {
    [USER_PERSONAL_DATA_REQUESTED]: async (context, event) => {
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
      const archiveFilePath = `./${archiveId}.json`
      fs.writeFileSync(archiveFilePath, JSON.stringify(archive, null, 2))
      let payload = {}
      try {
        // TODO: get app host from where?

        /*         const response = await fetch(
          'http://localhost:3000/api/register-archive',
          {
            method: 'put',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ archiveFilePath })
          }
        )
        payload = await response.json()
 */
console.log(sideEffects.uploader)
        const adapter = sideEffects.uploader
        const { uploadUrl, uploadId } = await adapter.getSignedPut('archives')
        await adapter.uploadPut(uploadUrl, archiveFilePath)
        const token = await adapter.createToken({ dir: 'archives' })

        payload = {
          token,
          uploadId
        }
        console.log(payload)
      } catch (error) {
        console.log(error)
        payload = { error }
      } finally {
        fs.unlinkSync(archiveFilePath)
        await sideEffects.executeCommand({
          type: 'completePersonalDataGathering',
          aggregateName: 'user-profile',
          aggregateId: userId,
          payload,
          jwtToken: systemToken()
        })
      }
    },
    [USER_PROFILE_DELETED]: async ({ sideEffects }, event) => {
      await sideEffects.secretsManager.deleteSecret(event.aggregateId)
    }
  }
}

export default saga
