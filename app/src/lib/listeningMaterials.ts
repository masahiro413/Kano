import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from './firebase'
import type { Level } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

function requireStorage() {
  if (!storage) throw new Error('Firebase is not configured')
  return storage
}

export interface ListeningMaterialInput {
  courseId: string
  level: Level
  title: string
  transcript: string
}

// staffが録音した音声ファイルをFirebase Storageにアップロードする方式(SPEC §4.3 (a))。
// TTS自動生成(SPEC §4.3 (b))は外部APIの秘密鍵をクライアントに置けないため未実装
// (Cloud Functions等サーバーサイド経由での実装が必要。TASKS.md参照)。
export async function addListeningMaterial(
  input: ListeningMaterialInput,
  audioFile: File,
) {
  const path = `listening-materials/${Date.now()}-${audioFile.name}`
  const storageRef = ref(requireStorage(), path)
  await uploadBytes(storageRef, audioFile)

  await addDoc(collection(requireDb(), 'listeningMaterials'), {
    ...input,
    audioAssetPath: path,
    source: 'upload',
    createdAt: serverTimestamp(),
  })
}

export async function getListeningMaterialUrl(audioAssetPath: string) {
  return getDownloadURL(ref(requireStorage(), audioAssetPath))
}

export async function updateListeningMaterialMeta(
  id: string,
  input: ListeningMaterialInput,
) {
  await updateDoc(doc(requireDb(), 'listeningMaterials', id), { ...input })
}

export async function deleteListeningMaterial(id: string, audioAssetPath: string) {
  await deleteDoc(doc(requireDb(), 'listeningMaterials', id))
  await deleteObject(ref(requireStorage(), audioAssetPath)).catch(() => {
    // Storage側の削除失敗はFirestoreドキュメント削除をブロックしない
  })
}
