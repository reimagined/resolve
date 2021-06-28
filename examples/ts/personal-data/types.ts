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
