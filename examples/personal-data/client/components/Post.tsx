import React from 'react'
import { Card, CardBody, CardTitle, CardText } from 'reactstrap'

type PostProps = {
  title: string
  content: string
}

const Post = ({ post }: { post: PostProps }) => {
  const { title, content } = post
  return (
    <div className="mb-3">
      <Card>
        <CardBody>
          <CardTitle>{title}</CardTitle>
          <CardText>{content}</CardText>
        </CardBody>
      </Card>
    </div>
  )
}

export default Post
