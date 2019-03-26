import {
  STORY_CREATED,
  USER_CREATED
} from "../event-types";

export default {
  [ STORY_CREATED ]: async (
    es,
    { aggregateId, payload: { title, text } }
  ) => es.create({
    index: "primary",
    type: "story",
    id: aggregateId,
    body: {
      aggregateId,
      text: `${title} ${text}`
    }
  }),

  [ USER_CREATED ]: async (
    es,
    { aggregateId, payload: { name } }
  ) => es.create({
    index: "primary",
    type: "user",
    id: aggregateId,
    body: {
      aggregateId,
      text: name
    }
  }),

  /* from module "resolve-module-comments" */
  COMMENT_CREATED: async (
    es,
    { aggregateId, payload: { commentId, content: { text } } }
  ) => es.create({
    index: "primary",
    type: "comment",
    id: commentId,
    body: {
      aggregateId,
      text
    }
  }),

  COMMENT_REMOVED: async (
    es,
    { payload: { commentId } }
  ) => es.delete({
    index: "primary",
    type: "comment",
    id: commentId
  })
};
