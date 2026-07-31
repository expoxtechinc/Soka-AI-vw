import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { User, ChatMessage } from '../types';

/**
 * Save or sync user profile to Firestore `/users/{userId}`
 */
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      role: user.role,
      createdAt: user.createdAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfileFromFirestore(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save chat message to `/users/{userId}/messages/{messageId}`
 */
export async function saveChatMessageToFirestore(userId: string, message: ChatMessage, category?: string): Promise<void> {
  const path = `users/${userId}/messages/${message.id}`;
  try {
    const dataToSave: any = {
      id: message.id,
      userId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
    };
    if (category) dataToSave.category = category;
    if (message.modelUsed) dataToSave.modelUsed = message.modelUsed;

    await setDoc(doc(db, 'users', userId, 'messages', message.id), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all chat messages for a user
 */
export async function fetchChatHistoryFromFirestore(userId: string): Promise<ChatMessage[]> {
  const path = `users/${userId}/messages`;
  try {
    const q = query(collection(db, 'users', userId, 'messages'), orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    querySnapshot.forEach((docSnap) => {
      messages.push(docSnap.data() as ChatMessage);
    });
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Clear chat history from Firestore for user
 */
export async function clearChatHistoryInFirestore(userId: string): Promise<void> {
  const path = `users/${userId}/messages`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'messages'));
    const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Realtime listener for user messages
 */
export function subscribeToChatMessages(
  userId: string, 
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/messages`;
  const q = query(collection(db, 'users', userId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = [];
    snapshot.forEach(docSnap => {
      msgs.push(docSnap.data() as ChatMessage);
    });
    onUpdate(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    if (onError) onError(error);
  });
}
