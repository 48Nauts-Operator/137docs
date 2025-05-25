import Dexie from 'dexie';

export interface CachedDocument {
  id: number;
  data: any; // server JSON
  updated_at: string; // ISO string for conflict resolution
}

// @ts-nocheck

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – Dexie typings are pulled in at compile time
class DocDb extends Dexie {
  documents!: any;
  constructor() {
    super('docai_local');
    this.version(1).stores({
      documents: 'id, updated_at',
    });

    // Add users store in second version so existing installations upgrade gracefully
    this.version(2).stores({
      documents: 'id, updated_at',
      users: 'id, updated_at',
    });

    // v3: address book cache for offline-first
    this.version(3).stores({
      documents: 'id, updated_at',
      users: 'id, updated_at',
      address_book: 'id, updated_at',
    });
  }
}

export const docDb = new DocDb(); 