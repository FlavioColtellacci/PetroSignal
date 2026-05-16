"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function isFirebaseClientConfigured() {
  return (
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.authDomain &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.appId
  )
}

function getFirebaseApp() {
  if (!isFirebaseClientConfigured()) {
    return null
  }

  if (getApps().length > 0) {
    return getApp()
  }

  return initializeApp(firebaseConfig)
}

const app = getFirebaseApp()
export const firebaseAuth = app ? getAuth(app) : null
