export type UserProfile = {
  id: string
  nickname: string
  firstName: string
  lastName: string
  fullName: string
  contacts: {
    phoneNumber?: string
    address?: string
  }
  archive?: {
    id: string | null
    token: string | null
    timestamp: string
  }
}

export type BlogPost = {
  author: string
  id: string
  title: string
  content: string
}
