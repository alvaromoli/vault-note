export interface Book {
  id?: string;
  title: string;
  createdAt: number;
}

export interface Note {
  id?: string;
  bookId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Credential {
  id?: string;
  name: string;
  username: string;
  passwordStr: string;
  url: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}
