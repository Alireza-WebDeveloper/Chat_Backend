import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// !! Error Message Function
function ErrorMessage(message) {
  return new GraphQLError('the error message', {
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

// !! Resolvers
const resolvers = {
  Query: {
    getSource: async () => {
      return { url: 'http://localhost:8000/graphql' };
    },
  },
};

export { resolvers };
