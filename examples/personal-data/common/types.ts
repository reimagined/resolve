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
}
