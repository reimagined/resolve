export default `
  type User {
    id: ID!
    name: String
    createdAt: String
  }
  type Story {
    id: ID!
    type: String!
    title: String!
    link: String
    text: String
    commentCount: Int!
    votes: [String]
    createdAt: String!
    createdBy: String!
    createdByName: String!
  }
  type Comment {
    id: ID!
    parentId: ID!
    storyId: ID!
    text: String!
    replies: [Comment]
    createdAt: String!
    createdBy: String!
    createdByName: String
    level: Int
  }
  type Query {
    user(id: ID, name: String): User
    me: User
    stories(type: String, first: Int, offset: Int!): [Story]
    comments(first: Int, offset: Int!): [Comment]
  }
`
