import React from 'react'
import { Card, CardBody, CardTitle, CardText } from 'reactstrap'
import Markdown from 'react-markdown'
import { BlogPost } from '../../common/types'

const Image = props => <img {...props} className="img-fluid" />

const Post = ({ post }: { post: BlogPost }) => {
  const { title, content } = post
  return (
    <div className="mb-3">
      <Card>
        <CardBody>
          <CardTitle tag="h1">{title}</CardTitle>
          <CardText tag="div">
            <Markdown source={content} renderers={{ image: Image }} />
          </CardText>
        </CardBody>
      </Card>
    </div>
  )
}

export default Post
