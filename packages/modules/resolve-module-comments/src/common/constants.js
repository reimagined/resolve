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

// Resolver Names
export const resolverNames = {
  ReadCommentsTree: 'ReadCommentsTree',
  ReadAllCommentsPaginate: 'ReadAllCommentsPaginate'
}

// Aggregate Name
export const defaultAggregateName = 'Comments'

// Read Model Name
export const defaultReadModelName = 'Comments'
