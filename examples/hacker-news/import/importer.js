import uuid from 'uuid';

import {
  USER_CREATED,
  STORY_CREATED,
  STORY_UPVOTED,
  STORY_COMMENTED
} from '../common/events';

import api from './api';
import eventStore, { dropStore } from './eventStore';

const USER_CREATED_TIMESTAMP = new Date(2007, 1, 19).getTime();

const users = {};

const generateUserEvents = name => {
  const aggregateId = uuid.v4();

  eventStore.saveEventRaw({
    type: USER_CREATED,
    aggregateId,
    timestamp: USER_CREATED_TIMESTAMP,
    payload: { name }
  });

  users[name] = aggregateId;
  return aggregateId;
};

const getUserId = userName => {
  const user = users[userName];

  if (user) {
    return user;
  }

  const aggregateId = generateUserEvents(userName);
  users[userName] = aggregateId;
  return aggregateId;
};

const generateCommentEvents = (comment, aggregateId, parentId) => {
  const userName = comment.by;
  const userId = getUserId(userName);
  const commentId = uuid.v4();

  eventStore.saveEventRaw({
    type: STORY_COMMENTED,
    aggregateId,
    timestamp: comment.time * 1000,
    payload: {
      userId,
      userName,
      text: comment.text || '',
      commentId,
      parentId
    }
  });

  return commentId;
};

const generateComment = async (comment, aggregateId, parentId) => {
  const commentId = generateCommentEvents(comment, aggregateId, parentId);

  if (comment.kids) {
    await generateComments(comment.kids, aggregateId, commentId);
  }

  return aggregateId;
};

async function generateComments(ids, aggregateId, parentId) {
  const comments = await api.fetchItems(ids);
  return comments.reduce(
    (promise, comment) =>
      promise.then(
        comment && comment.by
          ? generateComment(comment, aggregateId, parentId)
          : null
      ),
    Promise.resolve()
  );
}

const generatePointEvents = (aggregateId, pointCount) => {
  const keys = Object.keys(users);
  const count = Math.min(keys.length, pointCount);

  for (let i = 0; i < count; i++) {
    eventStore.saveEventRaw({
      type: STORY_UPVOTED,
      aggregateId,
      timestamp: Date.now(),
      payload: {
        userId: users[keys[i]]
      }
    });
  }
};

const generateStoryEvents = async story => {
  if (!story || !story.by) {
    return;
  }

  const userName = story.by || 'anonymous';
  const aggregateId = uuid.v4();

  eventStore.saveEventRaw({
    type: STORY_CREATED,
    aggregateId,
    timestamp: story.time * 1000,
    payload: {
      title: story.title || '',
      text: story.text || '',
      userId: getUserId(userName),
      userName,
      link: story.url || ''
    }
  });

  if (story.score) {
    generatePointEvents(aggregateId, story.score);
  }

  if (story.kids) {
    await generateComments(story.kids, aggregateId, aggregateId);
  }

  return aggregateId;
};

const getUniqueStoryIds = categories => {
  const result = categories.reduce((set, ids = []) => {
    ids.forEach(id => set.add(id));
    return set;
  }, new Set());

  return [...result];
};

const fetchStoryIds = async () => {
  const categories = await Promise.all(
    ['topstories', 'newstories', 'showstories', 'askstories'].map(category =>
      api.fetchStoryIds(category)
    )
  );

  return getUniqueStoryIds(categories);
};

const fetchStories = async (ids, tickCallback) => {
  const stories = await api.fetchItems(ids);

  return stories.reduce(
    (promise, story) =>
      promise.then(() => {
        tickCallback();

        return story && !story.deleted && story.by
          ? generateStoryEvents(story)
          : null;
      }),
    Promise.resolve()
  );
};

export const start = async (countCallback, tickCallback) => {
  try {
    const storyIds = await fetchStoryIds();
    countCallback(storyIds.length);
    dropStore();
    return await fetchStories(storyIds, tickCallback);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  return null;
};
