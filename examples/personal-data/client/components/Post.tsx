import React from 'react'
import { Card, CardBody, CardTitle, CardText } from 'reactstrap'
import Markdown from 'react-markdown'
import { BlogPost } from '../../common/types'

const Post = ({ post }: { post: BlogPost }) => {
  const { title, content } = post
  return (
    <div className="mb-3">
      <Card>
        <CardBody>
          <CardTitle>{title}</CardTitle>
          <CardText>
            <Markdown source={content} />
          </CardText>
        </CardBody>
      </Card>
    </div>
  )
}

export default Post
