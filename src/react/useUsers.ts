import { collection, Firestore, onSnapshot } from 'firebase/firestore';
import React from 'react';

import { USERS_COLLECTION_NAME } from '.';
import { IUser } from './types';
import { useFirebaseUser } from './useFirebaseUser';

/** Returns a stream of all users from Firebase */
export const useUsers = (db: Firestore) => {
  const [users, setUsers] = React.useState<IUser[]>([])
  const { firebaseUser } = useFirebaseUser()

  React.useEffect(() => {
    if (!firebaseUser) {
      setUsers([])
      return
    }

    const _collection = collection(db, USERS_COLLECTION_NAME);
    const _onSnapshot = onSnapshot(_collection, (query) => {
      const newUsers: IUser[] = []

      query?.forEach((doc) => {
        if (firebaseUser.uid === doc.id) return

        const data = doc.data()!

        const user: IUser = {
          // Ignore types here, not provided by the Firebase library
          // type-coverage:ignore-next-line
          createdAt: data.createdAt?.toMillis() ?? undefined,
          // type-coverage:ignore-next-line
          firstName: data.firstName ?? undefined,
          id: doc.id,
          // type-coverage:ignore-next-line
          imageUrl: data.imageUrl ?? undefined,
          // type-coverage:ignore-next-line
          lastName: data.lastName ?? undefined,
          // type-coverage:ignore-next-line
          lastSeen: data.lastSeen?.toMillis() ?? undefined,
          // type-coverage:ignore-next-line
          metadata: data.metadata ?? undefined,
          // type-coverage:ignore-next-line
          updatedAt: data.updatedAt?.toMillis() ?? undefined,
        }

        newUsers.push(user)
      })

      setUsers(newUsers)
    })

    return _onSnapshot;
  }, [firebaseUser])

  return { users }
}
