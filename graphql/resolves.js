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

const messageSchema = new Schema({
  user_send: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user_recive: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const MessageModel = mongoose.model('Message', messageSchema);
const UserModel = mongoose.model('User', UserSchema);
// !! Resolvers
const resolvers = {
  Query: {
    getProfile: async (_root, data, context) => {
      const { user_id } = context;
      if (!user_id) {
        return ErrorMessage('');
      }
      const user = await UserModel.findOne({ _id: user_id });
      if (user) {
        return {
          message: 'success',
          status: 200,
          data: {
            user,
          },
        };
      }
      return ErrorMessage('');
    },
    messages: async (parent, { user_send, user_recive }) => {
      return await MessageModel.find({
        user_send: ObjectId(user_send),
        user_recive: ObjectId(user_recive),
      }).toArray();
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
    sendMessage: async (
      _root,
      { user_send, user_recive, content },
      context
    ) => {
      // !! 1 )  Create Message
      const newMessage = {
        user_send: ObjectId(user_send),
        user_recive: ObjectId(user_recive),
        content,
        timestamp: new Date().toISOString(),
      };
      // !! 2 )
      await MessageModel.create(newMessage);
      return null;
    },
  },
};

export { resolvers };
