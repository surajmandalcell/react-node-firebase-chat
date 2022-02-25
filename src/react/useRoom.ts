import { collection, doc, Firestore, onSnapshot } from 'firebase/firestore';
import React from 'react';

import { processRoomDocument, ROOMS_COLLECTION_NAME } from '../common/utils';
import { IRoom } from './types';
import { useFirebaseUser } from './useFirebaseUser';

/** Returns a stream of changes in a room from Firebase */
export const useRoom = (initialRoom: IRoom, db: Firestore) => {
  const [room, setRoom] = React.useState(initialRoom);
  const { firebaseUser } = useFirebaseUser();

  React.useEffect(() => {
    if (!firebaseUser) return;

    const _collection = collection(db, ROOMS_COLLECTION_NAME);
    const _doc = doc(_collection, initialRoom.id);
    const _onSnapshot = onSnapshot(_doc, async (__doc) => {
      const newRoom = await processRoomDocument({ _doc: __doc, firebaseUser });

      setRoom(newRoom);
    });
    return _onSnapshot;
  }, [firebaseUser, initialRoom.id]);

  return { room };
};
