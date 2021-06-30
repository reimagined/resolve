import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { Button, Alert } from 'reactstrap'
import Feed from './Feed'
import PostForm from './PostForm'
import UserContext from '../userContext'
const NewPost = ({ successHandlerProp }) => {
  const [values, setValues] = useState({
    error: null,
    collapsed: true,
  })
  const { collapsed, error } = values
  const toggleCollapsed = () => {
    setValues({ ...values, collapsed: !collapsed })
  }
  const errorHandler = (error) => {
    setValues({ ...values, collapsed: false, error })
  }
  const successHandler = (result) => {
    setValues({ collapsed: true, error: null })
    successHandlerProp(result)
  }
  return (
    <React.Fragment>
      {collapsed ? (
        <Button onClick={toggleCollapsed}>Publish new post</Button>
      ) : (
        <PostForm successHandler={successHandler} errorHandler={errorHandler} />
      )}
      {error && (
        <Alert color="danger">An error occurred while publishing</Alert>
      )}
    </React.Fragment>
  )
}
const FeedByAuthor = ({ authorId, user }) => {
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
    (result) => {
      const nextPosts = posts.map((p) => p)
      const {
        aggregateId,
        timestamp,
        payload: { authorId, title, content },
      } = result
      nextPosts.unshift({
        author: authorId,
        title,
        content,
        id: aggregateId,
        timestamp,
      })
      setPosts(nextPosts)
    },
    [posts]
  )
  return (
    <React.Fragment>
      <UserContext.Provider value={user}>
        <div className="mb-3">
          {authorId === user.id && (
            <NewPost successHandlerProp={successCallback} />
          )}
        </div>
        <Feed posts={posts} />
      </UserContext.Provider>
    </React.Fragment>
  )
}
export default FeedByAuthor
