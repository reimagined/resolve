import React, { useContext, useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  CardText,
  CardFooter,
  Button,
} from 'reactstrap'
import Markdown from 'react-markdown'
import { useCommand } from '@resolve-js/react-hooks'
import UserContext from '../userContext'
const Image = (props) => <img {...props} className="img-fluid" alt="" />
const Post = ({ post }) => {
  const { title, content, author, id: postId } = post
  const user = useContext(UserContext)
  const [state, setState] = useState({
    deleted: false,
    deletionError: null,
  })
  const { deleted } = state
  const deletePost = useCommand(
    {
      type: 'delete',
      aggregateId: postId,
      aggregateName: 'blog-post',
      payload: {},
    },
    (error) => {
      if (error) {
        setState({ ...state, deletionError: error })
      } else {
        setState({
          ...state,
          deletionError: null,
          deleted: true,
        })
      }
    },
    [content]
  )
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
          <Button outline color="danger" size="sm" onClick={() => deletePost()}>
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
