import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { PolicyRecord, AccountantUser } from "../types/index";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Web app Firebase configuration
export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyAfAoVZzZ4V59DuTGPXrl28LIMvsS89UWA",
  authDomain: firebaseConfigJson.authDomain || "v-shiroya-insurance.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "v-shiroya-insurance",
  storageBucket: firebaseConfigJson.storageBucket || "v-shiroya-insurance.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "940780508167",
  appId: firebaseConfigJson.appId || "1:940780508167:web:4ed6dc9491c5651a71c6a2",
  measurementId: firebaseConfigJson.measurementId || "G-P0JYHF0X90"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with Database ID from provisioned config
const databaseId = (firebaseConfigJson as any).firestoreDatabaseId && (firebaseConfigJson as any).firestoreDatabaseId !== ""
  ? (firebaseConfigJson as any).firestoreDatabaseId
  : "(default)";

export const db = getFirestore(app, databaseId);

const POLICIES_COLLECTION = "policies";

/**
 * Update user profile in Firestore
 */
export async function updateFirestoreProfile(userId: string, updates: Partial<AccountantUser>): Promise<void> {
  const path = `profiles/${userId}`;
  try {
    const docRef = doc(db, 'profiles', userId);
    await setDoc(docRef, updates, { merge: true });
    console.log(`Profile for ${userId} successfully updated!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all policy documents from Firestore database
 */
export async function fetchFirestorePolicies(): Promise<PolicyRecord[]> {
  try {
    const colRef = collection(db, POLICIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const policies: PolicyRecord[] = [];
    snapshot.forEach((docSnap) => {
      policies.push(docSnap.data() as PolicyRecord);
    });
    return policies;
  } catch (error) {
    console.error("Firestore fetch error:", error);
    throw error;
  }
}

/**
 * Sanitizes policy payload to prevent exceeding Firestore's 1MB (1,048,576 bytes) document limit.
 */
function sanitizePolicyForFirestore<T extends Partial<PolicyRecord>>(policy: T): T {
  const sanitized = { ...policy };

  // Truncate extractedText if oversized
  if (sanitized.extractedText && typeof sanitized.extractedText === 'string' && sanitized.extractedText.length > 20000) {
    sanitized.extractedText = sanitized.extractedText.slice(0, 20000) + '... [text truncated for database index]';
  }

  // Strip/omit large base64 data URLs from Firestore document payload
  if (sanitized.documentUrl && typeof sanitized.documentUrl === 'string' && sanitized.documentUrl.length > 350000) {
    sanitized.documentUrl = null;
  }

  // Double check serialized JSON string length
  try {
    const jsonLen = JSON.stringify(sanitized).length;
    if (jsonLen > 700000) {
      sanitized.documentUrl = null;
      if (sanitized.extractedText && sanitized.extractedText.length > 5000) {
        sanitized.extractedText = sanitized.extractedText.slice(0, 5000) + '... [truncated]';
      }
    }
  } catch (e) {
    // Fallback if stringify fails
  }

  return sanitized;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(`Firestore Error [${operationType} on ${path}]: ${errInfo.error}`);
}

/**
 * Save or insert a policy document directly into Firestore Database
 */
export async function saveFirestorePolicy(policy: PolicyRecord): Promise<void> {
  const path = `${POLICIES_COLLECTION}/${policy.id}`;
  try {
    const docRef = doc(db, POLICIES_COLLECTION, policy.id);
    const sanitized = sanitizePolicyForFirestore(policy);
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Policy #${policy.policyNumber} (${policy.id}) successfully saved to Firestore!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update an existing policy document in Firestore
 */
export async function updateFirestorePolicy(id: string, updates: Partial<PolicyRecord>): Promise<void> {
  const path = `${POLICIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, POLICIES_COLLECTION, id);
    const sanitized = sanitizePolicyForFirestore(updates);
    await updateDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a policy document from Firestore
 */
export async function deleteFirestorePolicy(id: string): Promise<void> {
  const path = `${POLICIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, POLICIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to real-time updates for policy records in Firestore
 */
export function subscribeToFirestorePolicies(onUpdate: (policies: PolicyRecord[]) => void) {
  const colRef = collection(db, POLICIES_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const policies: PolicyRecord[] = [];
    snapshot.forEach((docSnap) => {
      policies.push(docSnap.data() as PolicyRecord);
    });
    onUpdate(policies);
  }, (error) => {
    console.error("Firestore snapshot listener error:", error);
  });
}
