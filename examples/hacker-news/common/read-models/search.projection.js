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
    type: "doc",
    id: aggregateId,
    body: {
      aggregate: "Story",
      criteria: `${title} ${text}`
    }
  }),

  [ USER_CREATED ]: async (
    es,
    { aggregateId, payload: { name } }
  ) => es.create({
    index: "primary",
    type: "doc",
    id: aggregateId,
    body: {
      aggregate: "User",
      text: name
    }
  }),

  /* from module "resolve-module-comments" */
  COMMENT_CREATED: async (
    es,
    { aggregateId, payload: { content: { text, parentId } } }
  ) => es.create({
    index: "primary",
    type: "doc",
    id: aggregateId,
    body: {
      aggregate: "Comment",
      text,
      parentId
    }
  }),

  COMMENT_REMOVED: async (
    es,
    { aggregateId }
  ) => es.delete({
    index: "primary",
    type: "doc",
    id: aggregateId
  })
};
