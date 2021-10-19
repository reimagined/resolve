export type UserState = {
  id: string
  name: string
}

export type OptimisticState = {
  votedStories: {
    [key: string]: boolean
  }
  refreshId: string
}

export type StoreState = {
  jwt: UserState
  optimistic: OptimisticState
}

export type UserConfirmationSagaSideEffects = {
  sendEmail: (email: string, subject: string, body: string) => void
}

export type GetStoriesParams = {
  first: number
  offset: number
}
