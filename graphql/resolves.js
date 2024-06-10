import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// !! Error Message Function
function ErrorMessage(message = 'the error message') {
  return new GraphQLError(message, {
    extensions: {
      code: 'SOMETHING_BAD_HAPPENED',
      http: {
        status: 404,
        headers: new Map([
          ['some-header', 'it was bad'],
          ['another-header', 'seriously'],
        ]),
      },
    },
  });
}

// Schema
const { Schema } = mongoose;
const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
  },
  {
    collection: 'User',
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // delete ret._id;
        delete ret.id;
        // delete ret.password;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        // delete ret._id;
        delete ret.id;
        // delete ret.password;
      },
    },
  }
);

const UserModel = mongoose.model('User', UserSchema);
// !! Resolvers
const resolvers = {
  Query: {
    getSource: async () => {
      return { url: 'http://localhost:8000/graphql' };
    },
  },
  Mutation: {
    login: async (_root, props, context) => {
      const { username, password } = props;
      // 1 ) Check Validation Props
      if (!username || !password) {
        ErrorMessage('Please Enter Username,Password');
      }
      // 2 ) DataBase Search
      const user = await UserModel.findOne({ username, password });
      if (!user) {
        ErrorMessage('username or password wrong!');
      }
      return {
        message: 'success',
        status: 200,
        data: {
          user,
        },
      };
    },
  },
};

export { resolvers };
