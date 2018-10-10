// Events
export const eventTypes = {
  COMMENT_CREATED: '@resolve-module-comments/COMMENT_CREATED',
  COMMENT_UPDATED: '@resolve-module-comments/COMMENT_UPDATED',
  COMMENT_REMOVED: '@resolve-module-comments/COMMENT_REMOVED'
}

// Actions
export const actionTypes = {
  OPTIMISTIC_COMMENTS_CREATED:
    '@resolve-module-comments/OPTIMISTIC_COMMENTS_CREATED',
  OPTIMISTIC_COMMENT_CREATED:
    '@resolve-module-comments/OPTIMISTIC_COMMENT_CREATED',
  OPTIMISTIC_COMMENT_UPDATED:
    '@resolve-module-comments/OPTIMISTIC_COMMENT_UPDATED',
  OPTIMISTIC_COMMENT_REMOVED:
    '@resolve-module-comments/OPTIMISTIC_COMMENT_REMOVED'
}

// Command Types
export const commandTypes = {
  CREATE_COMMENT: '@resolve-module-comments/CREATE_COMMENT',
  UPDATE_COMMENT: '@resolve-module-comments/UPDATE_COMMENT',
  REMOVE_COMMENT: '@resolve-module-comments/REMOVE_COMMENT'
}

// Reducer Name
export const DEFAULT_REDUCER_NAME = 'comments'

// Aggregate Name
export const DEFAULT_AGGREGATE_NAME = 'Comments'

// Read Model Name
export const DEFAULT_READ_MODEL_NAME = 'Comments'

// Comments Table Name
export const DEFAULT_COMMENTS_TABLE_NAME = 'Comments'

// Resolver Names
export const resolverNames = {
  READ_COMMENTS_TREE: 'ReadCommentsTree',
  READ_ALL_COMMENTS_PAGINATE: 'ReadAllCommentsPaginate'
}
