import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getFirestoreDb } from "@/lib/firebase-admin";
import type { ArticleRecord } from "@/lib/firestore-types";

const ARTICLES_COLLECTION = "articles";

function mapArticle(snapshot: QueryDocumentSnapshot): ArticleRecord {
  const data = snapshot.data() as Omit<ArticleRecord, "id">;
  return {
    id: snapshot.id,
    ...data,
  };
}

export async function getArticleByCanonicalUrlHash(
  canonicalUrlHash: string,
): Promise<ArticleRecord | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await db
    .collection(ARTICLES_COLLECTION)
    .where("canonicalUrlHash", "==", canonicalUrlHash)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];
  if (!doc) {
    return null;
  }

  return mapArticle(doc);
}

export async function writeArticles(articles: ArticleRecord[]): Promise<number> {
  if (articles.length === 0) {
    return 0;
  }

  const db = getFirestoreDb();
  if (!db) {
    return 0;
  }

  const batch = db.batch();
  for (const article of articles) {
    const ref = db.collection(ARTICLES_COLLECTION).doc(article.id);
    batch.set(ref, article);
  }

  await batch.commit();
  return articles.length;
}

export async function getRecentArticlesByAgent(
  agent: ArticleRecord["agent"],
  sinceIso: string,
  limit = 50,
): Promise<ArticleRecord[]> {
  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection(ARTICLES_COLLECTION)
    .where("agent", "==", agent)
    .where("publishedAt", ">=", sinceIso)
    .orderBy("publishedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(mapArticle);
}
