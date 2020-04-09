import * as React from 'react'
import { UserProfile } from '../common/types'

type BlogProps = {
  user: UserProfile
}

const UserBlog = (props: BlogProps): any => {
  return <div>{props.user.fullName}</div>
}

export default UserBlog
