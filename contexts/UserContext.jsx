import { createContext, useEffect, useState } from "react";
import { account, database } from "../lib/appwrite";
import { ID, Query } from "react-native-appwrite";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // --------------------------
  // LOGIN
  // --------------------------
  async function login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      await getInitialUserValue();   // Load merged profile after login
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // --------------------------
  // REGISTER
  // --------------------------
  async function register(email, password, name, label) {
    try {
      const newUser = await account.create(ID.unique(), email, password, name);

      // Real Appwrite user ID
      const authUserId = newUser.$id;

      // Create linked profile document
      await database.createDocument(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
        ID.unique(),
        {
          userID: authUserId,
          name,
          email,
          label
        }
      );

      // Auto login
      await login(email, password);

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // --------------------------
  // LOGOUT
  // --------------------------
  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  // --------------------------
  // MERGED AUTH + PROFILE LOADER
  // (keeps your function name)
  // --------------------------
  async function getInitialUserValue() {
    try {
      // 1. Get authenticated user
      const authUser = await account.get();

      // 2. Get database profile
      const profile = await database.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
        [Query.equal("userID", authUser.$id)]
      );

      const profileData = profile.documents[0] || {};

      // 3. Merge into single user object
      setUser({
        ...authUser,
        ...profileData
      });

    } catch (error) {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }

  // Load on app start
  useEffect(() => {
    getInitialUserValue();
  }, []);

  return (
    <UserContext.Provider
      value={{ user, login, logout, register, authChecked }}
    >
      {children}
    </UserContext.Provider>
  );
}
