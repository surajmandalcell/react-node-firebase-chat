import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import React from 'react';

import { fetchUser, processRoomsQuery, ROOMS_COLLECTION_NAME } from '../common/utils';
import { IRoom, IUser } from './types';
import { useFirebaseUser } from './useFirebaseUser';

/** Returns a stream of rooms from Firebase. Only rooms where current
 * logged in user exist are returned. `orderByUpdatedAt` is used in case
 * you want to have last modified rooms on top, there are a couple
 * of things you will need to do though:
 * 1) Make sure `updatedAt` exists on all rooms
 * 2) Write a Cloud Function which will update `updatedAt` of the room
 * when the room changes or new messages come in
 * 3) Create an Index (Firestore Database -> Indexes tab) where collection ID
 * is `rooms`, field indexed are `userIds` (type Arrays) and `updatedAt`
 * (type Descending), query scope is `Collection` */
export const useRooms = (orderByUpdatedAt?: boolean) => {
  const [rooms, setRooms] = React.useState<IRoom[]>([]);
  const { firebaseUser } = useFirebaseUser();
  const db = getFirestore();

  React.useEffect(() => {
    if (!firebaseUser) {
      setRooms([]);
      return;
    }

    let _collection;

    if (orderByUpdatedAt) {
      const col = collection(db, ROOMS_COLLECTION_NAME);
      _collection = query(
        col,
        where('userIds', 'array-contains', firebaseUser.uid),
        orderBy('updatedAt', 'desc'),
      );
    } else {
      const col = collection(db, ROOMS_COLLECTION_NAME);
      _collection = query(
        col,
        where('userIds', 'array-contains', firebaseUser.uid),
      );
    }

    return onSnapshot(_collection, async (_query: any) => {
      const newRooms = await processRoomsQuery({ firebaseUser, query: _query });

      setRooms(newRooms);
    });
  }, [firebaseUser, orderByUpdatedAt]);

  /** Creates a chat group room with `users`. Creator is automatically
   * added to the group. `name` is required and will be used as
   * a group name. Add an optional `imageUrl` that will be a group avatar
   * and `metadata` for any additional custom data. */
  const createGroupRoom = async ({
    imageUrl,
    metadata,
    name,
    users,
  }: {
    imageUrl?: string;
    metadata?: Record<string, any>;
    name: string;
    users: IUser[];
  }) => {
    if (!firebaseUser) return;

    const currentUser = await fetchUser(firebaseUser.uid);

    const roomUsers = [currentUser].concat(users);

    const _collection = collection(db, ROOMS_COLLECTION_NAME);
    const _docRef = doc(_collection);
    await setDoc(_docRef, {
      createdAt: serverTimestamp(),
      imageUrl,
      metadata,
      name,
      type: 'group',
      updatedAt: serverTimestamp(),
      userIds: roomUsers.map((u) => u.id),
      userRoles: roomUsers.reduce(
        (prev, curr) => ({ ...prev, [curr.id]: curr.role }),
        {},
      ),
    });

    const room = await getDoc(_docRef);

    return {
      id: room.id,
      imageUrl,
      metadata,
      name,
      type: 'group',
      users: roomUsers,
    } as IRoom;
  };

  /** Creates a direct chat for 2 people. Add `metadata` for any additional custom data. */
  const createRoom = async (
    otherUser: IUser,
    metadata?: Record<string, any>,
  ) => {
    if (!firebaseUser) return;

    const _collection = collection(db, ROOMS_COLLECTION_NAME);
    const _query = query(
      _collection,
      where('userIds', 'array-contains', firebaseUser.uid),
    );
    const _docs = await getDocs(_query);

    const allRooms = await processRoomsQuery({ firebaseUser, query: _docs });

    const existingRoom = allRooms.find((room) => {
      if (room.type === 'group') return false;

      const userIds = room.users.map((u) => u.id);
      return (
        userIds.includes(firebaseUser.uid) && userIds.includes(otherUser.id)
      );
    });

    if (existingRoom) {
      return existingRoom;
    }

    const currentUser = await fetchUser(firebaseUser.uid);

    const users = [currentUser].concat(otherUser);

    const _docRef = doc(_collection);
    await setDoc(_docRef, {
      createdAt: serverTimestamp(),
      imageUrl: undefined,
      metadata,
      name: undefined,
      type: 'direct',
      updatedAt: serverTimestamp(),
      userIds: users.map((u) => u.id),
      userRoles: undefined,
    });

    const room = await getDoc(_docRef);

    return {
      id: room.id,
      metadata,
      type: 'direct',
      users,
    } as IRoom;
  };

  return { createGroupRoom, createRoom, rooms };
};
