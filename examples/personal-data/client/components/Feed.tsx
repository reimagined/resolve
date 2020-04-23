import React, { useState, useEffect } from 'react'
import { useQuery } from 'resolve-react-hooks'
import Post from './Post'

const Feed = () => {
  const [posts, setPosts] = useState([])

  const getPosts = useQuery(
    { name: 'blog-posts', resolver: 'feed', args: {} },
    (error, result) => {
      setPosts(result.data)
    }
  )
  useEffect(() => {
    getPosts()
  }, [])

  return (
    <React.Fragment>
      {posts.map((p, idx) => (
        <Post key={idx} post={{ title: p.title, content: p.content }} />
      ))}
    </React.Fragment>
  )
}

export default Feed
