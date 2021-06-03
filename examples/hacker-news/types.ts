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
