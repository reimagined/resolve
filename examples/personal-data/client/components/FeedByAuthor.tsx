import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from 'resolve-react-hooks'
import { Button, Alert } from 'reactstrap'

import { UserProfile } from '../../common/types'
import Feed from './Feed'
import PostForm from './PostForm'

const NewPost = ({
  user,
  successHandlerProp
}: {
  user: UserProfile
  successHandlerProp: (arg: any) => void
}) => {
  const [values, setValues] = useState({
    error: null,
    collapsed: true
  })
  const { collapsed, error } = values

  const toggleCollapsed = () => {
    setValues({ ...values, collapsed: !collapsed })
  }

  const errorHandler = error => {
    setValues({ ...values, collapsed: false, error })
  }

  const successHandler = result => {
    setValues({ collapsed: true, error: null })
    successHandlerProp(result)
  }

  return (
    <React.Fragment>
      {collapsed ? (
        <Button onClick={toggleCollapsed}>Publish new post</Button>
      ) : (
        <PostForm
          owner={user}
          successHandler={successHandler}
          errorHandler={errorHandler}
        />
      )}
      {error && (
        <Alert color="danger">Ann error occurred while publishing</Alert>
      )}
    </React.Fragment>
  )
}

const FeedByAuthor = ({
  authorId,
  user
}: {
  authorId: string
  user: UserProfile
}) => {
  const [posts, setPosts] = useState([])

  const getPosts = useQuery(
    { name: 'blog-posts', resolver: 'feedByAuthor', args: { authorId } },
    (error, result) => {
      setPosts(result.data)
    }
  )
  useEffect(() => {
    getPosts()
  }, [])

  const successCallback = useCallback(
    result => {
      const nextPosts = posts.map(p => p)
      const {
        aggregateId,
        timestamp,
        payload: { authorId, title, content }
      } = result
      nextPosts.unshift({
        authorId,
        title,
        content,
        id: aggregateId,
        timestamp
      })
      setPosts(nextPosts)
    },
    [posts]
  )

  return (
    <React.Fragment>
      <div className="mb-3">
        {authorId === user.id && (
          <NewPost user={user} successHandlerProp={successCallback} />
        )}
      </div>
      <Feed posts={posts} />
    </React.Fragment>
  )
}

export default FeedByAuthor
