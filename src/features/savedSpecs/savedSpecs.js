import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'

function userSpecsRef(uid) {
  return collection(db, 'users', uid, 'specs')
}

export async function saveSpec(uid, { name, content }) {
  await addDoc(userSpecsRef(uid), {
    name,
    content,
    savedAt: serverTimestamp(),
  })
}

export async function loadSpecs(uid) {
  const q = query(userSpecsRef(uid), orderBy('savedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteSpec(uid, specId) {
  await deleteDoc(doc(db, 'users', uid, 'specs', specId))
}

export async function deleteAllUserData(uid) {
  const snapshot = await getDocs(userSpecsRef(uid))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
