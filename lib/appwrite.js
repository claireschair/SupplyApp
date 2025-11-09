import 'react-native-url-polyfill/auto';
import { Client, Account, Avatars } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const avatars = new Avatars(client);

export { client, account, avatars };
