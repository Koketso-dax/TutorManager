const { GraphQLServer } = require('graphql-yoga');
const { GraphQLScalarType, Kind } = require('graphql');
const mongoose = require("mongoose");
const typeDefs = require('./graphql/typeDefs');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { UserInputError } = require('apollo-server')
mongoose.connect('mongodb://localhost/TUTORMANAGER');

const User = mongoose.model('User', {
  userName: String,
  password: String,
  setSessions: Array,
  role: String,
  token: String,
})

const Session = mongoose.model('Session', {
  moduleName: String,
  sessionDate: Date,
  sessionLink: String,
  topic: String,
  attendees: Array,
})

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userName: user.userName,
      role: user.role

    },
    "KEEPINGOURUSERSSAFE", { expiresIn: '5h' }
  );
}

const dateScalar = new GraphQLScalarType({
  // definition for date type
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.getTime(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10); // Convert hard-coded AST string to type expected by parseValue
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

const resolvers = {

  Date: dateScalar,

  Query: {
    users: () => User.find(),
    sessions: () => Session(),
  },

  Mutation: {
    createUser: async (_, { userName, password, role }) => {
      const oldUser = await User.findOne({ userName });
      if (oldUser) {
        throw new UserInputError('Username already exists');
      }

      password = await bcrypt.hash(password, 12);
      const user = new User({ userName, password, role });
      user.token = generateToken(user);
      await user.save();
      return user;
    },

    updateUser: async (_, { id, userName, password }) => {
      await User.findByIdAndUpdate(id, { userName, password })
      return true
    },

    removeUser: async (_, { id }) => {
      await User.findByIdAndRemove(id)
      return true
    },

    loginUser: async (_, { userName, password }) => {
      const usr = await User.findOne({ where: { userName } });
      if (!usr) {
        error.general = 'User not found';
        throw new UserInputError('User not found');
      }
      const match = await bcrypt.compare(password, usr.password);
      if (!match) {
        error.general = 'Wrong Credentials';
        throw new UserInputError('Wrong Credentials');
      }
      return usr;
    },

    createSession: async (_, { moduleName, sessionDate, topic }) => {
      const sess = new Session({ moduleName, sessionDate, topic })
      await sess.save();
      return sess;
    },

    joinSession: async (_, { id, userID }) => {
      const ses = await Session.findOne({ where: { id } })
      if (ses.attendees.length <= 40) {
        await ses.attendees.push(User.findOne({ where: { userID } }))
        return true;
      }
      return false;
    },
  }

};

const server = new GraphQLServer({ typeDefs, resolvers })


mongoose.connection.once("open", function () {
  server.start(() => console.log('Server is running on localhost:4000'))

})
