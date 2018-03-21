// @flow

export type Event<Payload> = {
  type: string,
  aggregateId: string,
  timestamp: number,
  payload: Payload
}

export type RawEvent<Payload> = {
  type: string,
  payload: Payload
}

export type StoryCreated = {
  userId: string,
  userName: string,
  title: string,
  text: string,
  link: string
}

export type StoryUpvoted = {
  userId: string
}

export type StoryUnvoted = {
  userId: string
}

export type StoryCommented = {
  commentId: string,
  parentId: string,
  userId: string,
  userName: string,
  text: string
}

// User
export type UserCreated = {
  name: string
}
