import React from 'react'
import { Alert } from 'reactstrap'

import Post from './Post'

type FeetProps = { posts: any[] }

const Feed = ({ posts }: FeetProps) => {
  return (
    <React.Fragment>
      {posts.length > 0 ? (
        posts.map((p, idx) => (
          <Post
            key={idx}
            post={{
              title: p.title,
              content: p.content,
              author: p.author,
              id: p.id,
            }}
          />
        ))
      ) : (
        <Alert className="text-center" color="secondary">
          No posts created yet
        </Alert>
      )}
    </React.Fragment>
  )
}

export default Feed
