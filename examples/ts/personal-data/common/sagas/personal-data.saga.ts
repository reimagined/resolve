import { v4 as uuid } from 'uuid'
import fs from 'fs'
import { Saga } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import { PersonalDataSagaSideEffects } from '../../types'
import {
  USER_PERSONAL_DATA_REQUESTED,
  USER_PROFILE_DELETED,
} from '../user-profile.events'
import { systemToken } from '../jwt'

const saga: Saga<ResolveStore, PersonalDataSagaSideEffects> = {
  handlers: {
    Init: async () => Promise.resolve(),
    [USER_PERSONAL_DATA_REQUESTED]: async (context, event) => {
      const { aggregateId: userId } = event
      const { sideEffects } = context

      const { data: profile } = await sideEffects.executeQuery({
        modelName: 'user-profiles',
        resolverName: 'profile',
        resolverArgs: { userId },
        jwt: systemToken(),
      })

      const { data: posts } = await sideEffects.executeQuery({
        modelName: 'blog-posts',
        resolverName: 'feedByAuthor',
        resolverArgs: { authorId: userId },
        jwt: systemToken(),
      })

      const { data: media } = await sideEffects.executeQuery({
        modelName: 'medias',
        resolverName: 'byOwner',
        resolverArgs: { ownerId: userId },
        jwt: systemToken(),
      })

      const archive = { id: uuid(), profile, posts, media }
      const result = await sideEffects.createArchive(
        sideEffects.uploader,
        archive
      )

      await sideEffects.executeCommand({
        type: 'completePersonalDataGathering',
        aggregateName: 'user-profile',
        aggregateId: userId,
        payload: result,
        jwt: systemToken(),
      })
    },
    [USER_PROFILE_DELETED]: async ({ sideEffects }, event) => {
      await sideEffects.secretsManager.deleteSecret(event.aggregateId)
    },
  },
  sideEffects: {
    createArchive: async (adapter, archive) => {
      const archiveFilePath = `./${archive.id}.json`
      let result = {}
      try {
        for (const media of archive.media) {
          media.token = await adapter.createToken({ dir: 'images' })
        }

        fs.writeFileSync(archiveFilePath, JSON.stringify(archive, null, 2))
        const { uploadUrl, uploadId } = await adapter.getSignedPut('archives')
        await adapter.uploadPut(uploadUrl, archiveFilePath)
        const token = await adapter.createToken({
          dir: 'archives',
        })
        result = {
          token,
          uploadId,
        }
        fs.unlinkSync(archiveFilePath)
      } catch (error) {
        result = { error: true, token: null, uploadId: null }
      } finally {
        return result
      }
    },
  },
}

export default saga
