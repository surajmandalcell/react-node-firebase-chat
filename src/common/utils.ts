import auth, { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentSnapshot,
  getDoc,
  getFirestore,
  QueryDocumentSnapshot,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { IFirebaseChatCoreConfig, IRoom, IUser } from '../react/types';

export let ROOMS_COLLECTION_NAME = 'rooms'
export let USERS_COLLECTION_NAME = 'users'

/** Sets custom config to change default names for rooms
 * and users collections. Also see {@link FirebaseChatCoreConfig}. */
export const setConfig = (config: IFirebaseChatCoreConfig) => {
  ROOMS_COLLECTION_NAME = config.roomsCollectionName
  USERS_COLLECTION_NAME = config.usersCollectionName
}

/** Creates {@link User} in Firebase to store name and avatar used on rooms list */
export const createUserInFirestore = async (user: IUser) => {
  const db = getFirestore();
  const _collection = collection(db, USERS_COLLECTION_NAME)
  const _doc = doc(_collection, user.id);
  await setDoc(_doc, {
    createdAt: serverTimestamp(),
    firstName: user.firstName,
    imageUrl: user.imageUrl,
    lastName: user.lastName,
    lastSeen: user.lastSeen,
    metadata: user.metadata,
    role: user.role,
    updatedAt: serverTimestamp(),
  });
}

/** Removes {@link User} from `users` collection in Firebase */
export const deleteUserFromFirestore = async (userId: string) => {
  const db = getFirestore();
  const _collection = collection(db, USERS_COLLECTION_NAME)
  const _doc = doc(_collection, userId)
  await deleteDoc(_doc);
}

/** Fetches user from Firebase and returns a promise */
export const fetchUser = async (userId: string, role?: IUser['role']) => {
  const db = getFirestore();
  const _collection = collection(db, USERS_COLLECTION_NAME)
  const _doc = doc(_collection, userId);
  const __doc = await getDoc(_doc);

  const data = __doc.data()!

  const user: IUser = {
    // Ignore types here, not provided by the Firebase library
    // type-coverage:ignore-next-line
    createdAt: data.createdAt?.toMillis() ?? undefined,
    // type-coverage:ignore-next-line
    firstName: data.firstName ?? undefined,
    id: __doc.id,
    // type-coverage:ignore-next-line
    imageUrl: data.imageUrl ?? undefined,
    // type-coverage:ignore-next-line
    lastName: data.lastName ?? undefined,
    // type-coverage:ignore-next-line
    lastSeen: data.lastSeen?.toMillis() ?? undefined,
    // type-coverage:ignore-next-line
    metadata: data.metadata ?? undefined,
    role,
    // type-coverage:ignore-next-line
    updatedAt: data.updatedAt?.toMillis() ?? undefined,
  }

  return user
}

/** Returns an array of {@link Room}s created from Firebase query.
 * If room has 2 participants, sets correct room name and image. */
export const processRoomsQuery = async ({
  firebaseUser,
  query,
}: {
  firebaseUser: User,
  query: QuerySnapshot
}) => {
  const db = getFirestore();
  const promises = query.docs.map(async (_doc) =>
    processRoomDocument({ _doc, firebaseUser })
  )

  return await Promise.all(promises)
}

/** Returns a {@link Room} created from Firebase document */
export const processRoomDocument = async ({
  _doc,
  firebaseUser
}: {
  _doc: DocumentSnapshot<DocumentData>
  | QueryDocumentSnapshot<DocumentData>,
  firebaseUser: User
}) => {
  const db = getFirestore();
  const data = _doc.data()!

  // Ignore types here, not provided by the Firebase library
  // type-coverage:ignore-next-line
  const createdAt = data.createdAt?.toMillis() ?? undefined
  const id = _doc.id
  // type-coverage:ignore-next-line
  const updatedAt = data.updatedAt?.toMillis() ?? undefined

  // type-coverage:ignore-next-line
  let imageUrl = data.imageUrl ?? undefined
  let lastMessages
  // type-coverage:ignore-next-line
  let name = data.name ?? undefined
  // type-coverage:ignore-next-line
  const metadata = data.metadata ?? undefined
  // type-coverage:ignore-next-line
  const type = data.type as IRoom['type']
  // type-coverage:ignore-next-line
  const userIds = data.userIds as string[]
  const userRoles =
    // type-coverage:ignore-next-line
    (data.userRoles as Record<string, IUser['role']>) ?? undefined

  const users = await Promise.all(
    userIds.map((userId) => fetchUser(userId, userRoles?.[userId]))
  )

  if (type === 'direct') {
    const otherUser = users.find((u) => u.id !== firebaseUser.uid)

    if (otherUser) {
      imageUrl = otherUser.imageUrl
      name = `${otherUser.firstName ?? ''} ${otherUser.lastName ?? ''}`.trim()
    }
  }

  // type-coverage:ignore-next-line
  if (data.lastMessages && data.lastMessages instanceof Array) {
    // type-coverage:ignore-next-line
    lastMessages = data.lastMessages.map((lm: any) => {
      // type-coverage:ignore-next-line
      const author = users.find((u) => u.id === lm.authorId) ?? {
        // type-coverage:ignore-next-line
        id: lm.authorId as string,
      }

      return {
        // type-coverage:ignore-next-line
        ...(lm ?? {}),
        author,
        // type-coverage:ignore-next-line
        createdAt: lm.createdAt?.toMillis() ?? undefined,
        // type-coverage:ignore-next-line
        id: lm.id ?? '',
        // type-coverage:ignore-next-line
        updatedAt: lm.updatedAt?.toMillis() ?? undefined,
      }
    })
  }

  const room: IRoom = {
    createdAt,
    id,
    imageUrl,
    lastMessages,
    metadata,
    name,
    type,
    updatedAt,
    users,
  }

  return room
}
