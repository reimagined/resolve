import React from 'react';

import Comment from './Comment';
import ReplyLink from './ReplyLink';

const ChildrenComments = ({ storyId, parentId, comments, loggedIn }) => {
  if (!comments || !comments.length) {
    return null;
  }

  return (
    <div>
      {comments.map(comment => {
        if (comment.parentId !== parentId) {
          return null;
        }
        return (
          <Comment key={comment.id} storyId={storyId} {...comment}>
            {loggedIn ? (
              <ReplyLink storyId={storyId} commentId={comment.id} />
            ) : null}
            <ChildrenComments
              storyId={storyId}
              comments={comments}
              parentId={comment.id}
              loggedIn={loggedIn}
            />
          </Comment>
        );
      })}
    </div>
  );
};

export default ChildrenComments;
