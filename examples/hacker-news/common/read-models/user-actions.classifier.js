import {
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../event-types'

const classifier = event => {
  switch(event.type) {
    case STORY_CREATED:
    case STORY_UNVOTED:
    case STORY_UPVOTED:
    case USER_CREATED:
      return event.payload.userId
    case 'COMMENT_CREATED':
      return event.payload.authorId
    default:
      return 'default'
  }
}

export default classifier
