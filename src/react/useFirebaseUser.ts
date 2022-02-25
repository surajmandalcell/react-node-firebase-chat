import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React from 'react';

export const useFirebaseUser = () => {
  const auth = getAuth();
  const [firebaseUser, setFirebaseUser] = React.useState<User | undefined>();

  React.useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user ?? undefined);
    });
  });

  return { firebaseUser };
};
