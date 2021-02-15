const { GraphQLServer } = require('graphql-yoga');

module.exports = `
  scalar Date
  
  type Query {
    users:[User],
    sessions:[Session],
  },

  type User{
    id:ID!,
    userName:String!,
    password:String!,
    setSessions:[Session],
    role:String!,
    token:String,
  },
  
  type Session{
    id:ID!,
    moduleName:String!,
    sessionLink:String,
    sessionDate:Date!,
    topic:String!,
    attendees:[User],
  },

  type Mutation{
  
    createUser(userName:String!,password:String!,role:String!):User
    updateUser(id:ID!,userName:String!,password:String!):Boolean
    removeUser(id:ID!):Boolean
    loginUser(userName:String!,password:String!):User!
    createSession(moduleName:String!,sessionDate:Date!,topic:String!):Session
    joinSession(id:ID!,userID:ID!):Boolean
  },
`;