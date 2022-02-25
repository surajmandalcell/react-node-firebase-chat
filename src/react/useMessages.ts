import {
  collection,
  doc,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import React from 'react';

import { IRoom, MessageType } from './types';
import { useFirebaseUser } from './useFirebaseUser';

/** Returns a stream of messages from Firebase for a given room */
export const useMessages = (room: IRoom, db: Firestore) => {
  const [messages, setMessages] = React.useState<MessageType.Any[]>([]);
  const { firebaseUser } = useFirebaseUser();

  React.useEffect(() => {
    const _collection = collection(db, `rooms/${room.id}/messages`);
    const _query = query(_collection, orderBy('createdAt', 'desc'));
    const _onSnapshot = onSnapshot(_query, (query) => {
      const newMessages: MessageType.Any[] = [];

      query.forEach((doc) => {
        // Ignore `authorId`, `createdAt` and `updatedAt` types here, not provided by the Firebase library
        // type-coverage:ignore-next-line
        const { authorId, createdAt, updatedAt, ...rest } = doc.data();

        // type-coverage:ignore-next-line
        const author = room.users.find((u) => u.id === authorId) ?? {
          id: authorId as string,
        };

        newMessages.push({
          ...rest,
          author,
          // type-coverage:ignore-next-line
          createdAt: createdAt?.toMillis() ?? undefined,
          id: doc.id,
          // type-coverage:ignore-next-line
          updatedAt: updatedAt?.toMillis() ?? undefined,
        } as MessageType.Any);
      });

      setMessages(newMessages);
    });

    return _onSnapshot;
  }, [room.id, room.users]);

  /** Sends a message to the Firestore. Accepts any partial message. */
  const sendMessage = async (message: MessageType.PartialAny) => {
    if (!firebaseUser) return;

    const _collection = collection(db, `rooms/${room.id}/messages`);
    const _doc = doc(_collection);
    await setDoc(_doc, {
      ...message,
      authorId: firebaseUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  /** Updates a message in the Firestore. Accepts any message.
   * Message will probably be taken from the `useMessages` stream. */
  const updateMessage = async (message: MessageType.Any) => {
    if (!firebaseUser || message.author.id !== firebaseUser.uid) return;

    const messageToSend: Partial<MessageType.Any> = {
      ...message,
    };

    delete messageToSend.author;
    delete messageToSend.createdAt;
    delete messageToSend.id;

    const _collection = collection(db, `rooms/${room.id}/messages`);
    const _doc = doc(_collection, message.id);

    await updateDoc(_doc, {
      ...messageToSend,
      authorId: message.author.id,
      updatedAt: serverTimestamp(),
    });
  };

  return { messages, sendMessage, updateMessage };
};
