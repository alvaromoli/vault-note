export interface Book {
  id?: string;
  title: string;
  isDeleted?: boolean;
  createdAt: number;
}

export interface Note {
  id?: string;
  bookId: string;
  title: string;
  content: string;
  contentFormat?: 'markdown' | 'html';
  isFavorite?: boolean;
  isPinned?: boolean;
  isDeleted?: boolean;
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
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id?: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
}
