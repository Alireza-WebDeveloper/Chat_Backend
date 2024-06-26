import { PubSub } from 'graphql-subscriptions';
import mongoose from 'mongoose';

// Subscription
const pubSub = new PubSub();
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

// !! Schema
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

messageSchema.pre('find', function (next) {
  next();
});

// !! Resolvers
const resolvers = {
  // Query
  Query: {
    getProfile: async (_root, data, { user_id }) => {
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
    getUsers: async (_root, data, context) => {
      // 1 ) Find All Users
      const user = await UserModel.find();
      if (user) {
        return user;
      }
      return ErrorMessage('');
    },
    getMessages: async (parent, { user_send, user_recive }) => {
      // 1 ) Find Messages With References User_Recive , User_Send
      const messages = await MessageModel.find({
        $or: [
          { user_send, user_recive },
          { user_send: user_recive, user_recive: user_send },
        ],
      })
        .sort({ timestamp: 1 })
        .populate('user_recive', '-password')
        .populate('user_send', '-password');

      return messages;
    },
  },
  // Mutation
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
        user_send: user_send,
        user_recive: user_recive,
        content,
      };
      const message = (await MessageModel.create(newMessage)).populate(
        'user_send user_recive'
      );
      pubSub.publish('MESSAGE_ADDED', { messageAdded: message });
      return message;
    },
  },
  // Subscription
  Subscription: {
    messageAdded: {
      subscribe: (_root, _args, context) => {
        console.log(context);
        return pubSub.asyncIterator('MESSAGE_ADDED');
      },
    },
  },
};

export { resolvers };
