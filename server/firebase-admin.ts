import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';
import { db } from './db.js';

// Initialize Firebase Admin SDK for Auth token verification with studio-8864048816-3925b
if (!getApps().length) {
  initializeApp({
    projectId: 'studio-8864048816-3925b'
  });
}

export const auth = getAuth();

/**
 * Local Firestore adapter backed by the persistent database schema in database.json.
 * Provides full compatibility with collection(), doc(), where(), orderBy(), limit(), and batch()
 * ensuring offline/sandbox resilience without requiring cloud IAM service account credentials.
 */
class LocalDocumentReference {
  constructor(public collectionName: string, public id: string) {}

  async get() {
    const list = (db as any).data[this.collectionName] || [];
    const item = list.find((d: any) => d.id === this.id);
    return {
      id: this.id,
      exists: !!item,
      data: () => (item ? JSON.parse(JSON.stringify(item)) : undefined)
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    const list = (db as any).data[this.collectionName] || ((db as any).data[this.collectionName] = []);
    const idx = list.findIndex((d: any) => d.id === this.id);
    if (idx >= 0) {
      if (options?.merge) {
        list[idx] = { ...list[idx], ...data, id: this.id };
      } else {
        list[idx] = { ...data, id: this.id };
      }
    } else {
      list.push({ ...data, id: this.id });
    }
    db.save();
  }

  async update(updates: any) {
    const list = (db as any).data[this.collectionName] || ((db as any).data[this.collectionName] = []);
    const idx = list.findIndex((d: any) => d.id === this.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, id: this.id };
    } else {
      list.push({ ...updates, id: this.id });
    }
    db.save();
  }

  async delete() {
    const list = (db as any).data[this.collectionName];
    if (list) {
      (db as any).data[this.collectionName] = list.filter((d: any) => d.id !== this.id);
      db.save();
    }
  }
}

class LocalQuery {
  protected filters: Array<{ field: string; op: string; val: any }> = [];
  protected order: { field: string; dir: 'asc' | 'desc' } | null = null;
  protected limitNum: number | null = null;

  constructor(protected collectionName: string) {}

  where(field: string, op: string, val: any) {
    const q = this.clone();
    q.filters.push({ field, op, val });
    return q;
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    const q = this.clone();
    q.order = { field, dir };
    return q;
  }

  limit(n: number) {
    const q = this.clone();
    q.limitNum = n;
    return q;
  }

  private clone() {
    const q = new LocalQuery(this.collectionName);
    q.filters = [...this.filters];
    q.order = this.order ? { ...this.order } : null;
    q.limitNum = this.limitNum;
    return q;
  }

  async get() {
    let list = ((db as any).data[this.collectionName] || []).slice();

    for (const f of this.filters) {
      list = list.filter((item: any) => {
        const itemVal = item[f.field];
        if (f.op === '==') return itemVal === f.val;
        if (f.op === '!=') return itemVal !== f.val;
        if (f.op === 'in') return Array.isArray(f.val) && f.val.includes(itemVal);
        if (f.op === '<') return itemVal < f.val;
        if (f.op === '<=') return itemVal <= f.val;
        if (f.op === '>') return itemVal > f.val;
        if (f.op === '>=') return itemVal >= f.val;
        if (f.op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(f.val);
        return true;
      });
    }

    if (this.order) {
      const { field, dir } = this.order;
      list.sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return dir === 'asc' ? -1 : 1;
        if (valB === undefined || valB === null) return dir === 'asc' ? 1 : -1;
        return dir === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
      });
    }

    if (this.limitNum !== null && this.limitNum >= 0) {
      list = list.slice(0, this.limitNum);
    }

    const docs = list.map((item: any) => ({
      id: item.id,
      exists: true,
      data: () => JSON.parse(JSON.stringify(item))
    }));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length
    };
  }
}

class LocalCollectionReference extends LocalQuery {
  constructor(public collectionName: string) {
    super(collectionName);
  }

  doc(id?: string) {
    const docId = id || 'doc_' + crypto.randomUUID().slice(0, 12);
    return new LocalDocumentReference(this.collectionName, docId);
  }
}

class LocalWriteBatch {
  private ops: Array<() => Promise<void>> = [];

  set(docRef: any, data: any, options?: { merge?: boolean }) {
    this.ops.push(() => docRef.set(data, options));
    return this;
  }

  update(docRef: any, updates: any) {
    this.ops.push(() => docRef.update(updates));
    return this;
  }

  delete(docRef: any) {
    this.ops.push(() => docRef.delete());
    return this;
  }

  async commit() {
    for (const op of this.ops) {
      await op();
    }
  }
}

export const firestore: any = {
  collection: (name: string) => new LocalCollectionReference(name),
  batch: () => new LocalWriteBatch(),
  runTransaction: async (fn: any) => fn()
};

export default { auth, firestore };

