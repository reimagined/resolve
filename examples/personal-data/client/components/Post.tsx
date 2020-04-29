import React, { useContext, useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  CardText,
  CardFooter,
  Button
} from 'reactstrap'
import Markdown from 'react-markdown'
import { useCommand } from 'resolve-react-hooks'

import UserContext from '../userContext'
import { BlogPost, UserProfile } from '../../common/types'

const Image = props => <img {...props} className="img-fluid" />

const Post = ({ post }: { post: BlogPost }) => {
  const { title, content, author, id: postId } = post
  const user = useContext(UserContext) as UserProfile
  const [state, setState] = useState({
    deleted: false,
    deletionError: null
  })
  const { deleted, deletionError } = state

  const deletePost = useCommand(
    {
      type: 'delete',
      aggregateId: postId,
      aggregateName: 'blog-post',
      payload: {}
    },
    (error, result) => {
      if (error) {
        setState({ ...state, deletionError: error })
      } else {
        setState({
          ...state,
          deletionError: null,
          deleted: true
        })
      }
    },
    [content]
  ) as () => void

  const postView = (
    <Card>
      {title && <CardHeader>{title}</CardHeader>}
      <CardBody>
        <CardText tag="div">
          <Markdown source={content} renderers={{ image: Image }} />
        </CardText>
      </CardBody>
      {author === user.id && (
        <CardFooter style={{ display: 'flex', flexDirection: 'row-reverse' }}>
          <Button outline color="danger" size="sm" onClick={deletePost}>
            Delete post
          </Button>
        </CardFooter>
      )}
    </Card>
  )

  return (
    <div className="mb-3">
      {deleted ? (
        <Card>
          <CardBody>
            <CardText tag="div" className="text-muted">
              Post deleted
            </CardText>
          </CardBody>
        </Card>
      ) : (
        postView
      )}
    </div>
  )
}

export default Post
