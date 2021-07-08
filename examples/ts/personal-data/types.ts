import { CommandContext, ReadModelResolverContext } from '@resolve-js/core'

export type PersonalDataArchive = {
  id: string
  profile: any
  posts: any[]
  media: any[]
}

export type PersonalDataSagaSideEffects = {
  createArchive: (
    uploader: any,
    archive: PersonalDataArchive
  ) => Promise<object>
}

export type UserProfileViewModelState = {
  id: string
  nickname: string
  firstName: string
  lastName: string
  contacts: string
}

export type AuthCommandMiddlewareContext = {
  user: any
} & CommandContext

export type AuthResolverMiddlewareContext = {
  user: any
} & ReadModelResolverContext
