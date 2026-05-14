import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Book, Note, Credential, Task } from '../types';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { NotesList } from './NotesList';
import { HtmlNoteEditor } from './HtmlNoteEditor';
import { LockScreen } from './LockScreen';
import { SecretsView } from '../views/SecretsView';
import { TrashView } from '../views/TrashView';
import { SettingsView } from '../views/SettingsView';
import { TasksView } from '../views/TasksView';
import { Modal } from './Modal';
import './AppShell.css';

interface AppShellProps {
  isLocked: boolean;
  onLock: () => void;
  onUnlock: () => void;
}

export function AppShell({ isLocked, onLock, onUnlock }: AppShellProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [secrets, setSecrets] = useState<Credential[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'danger' | 'success' | 'prompt';
    onConfirm?: (value?: string) => void;
    placeholder?: string;
    defaultValue?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'confirm' | 'danger' = 'confirm') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const showPrompt = (title: string, message: string, onConfirm: (value: string) => void, placeholder = '', defaultValue = '') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'prompt',
      onConfirm: (val) => onConfirm(val || ''),
      placeholder,
      defaultValue
    });
  };

  // Load initial data
  useEffect(() => {
    if (!isLocked) {
      loadData();
    }
  }, [isLocked]);

  // Handle Lock specific state wiping
  useEffect(() => {
    if (isLocked) {
      setSelectedNote(null);
      setSearchQuery('');
      setSelectedFilter('all');
      setSelectedTag(null);
    }
  }, [isLocked]);

  const handleSelectFilter = (filter: string) => {
    setSelectedFilter(filter);
    setSelectedBook(null);
    setSelectedNote(null);
    setSelectedTag(null);
    setSelectedTaskId(null);
  };

  const handleSelectBook = (book: Book | null) => {
    setSelectedBook(book);
    setSelectedFilter('');
    setSelectedNote(null);
    setSelectedTag(null);
    setSelectedTaskId(null);
  };

  const handleSelectTag = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedFilter('all');
    setSelectedBook(null);
    setSelectedNote(null);
    setSelectedTaskId(null);
  };

  const loadData = async () => {
    try {
      const [booksItems, notesItems, secretsItems, tasksItems] = await Promise.all([
        invoke<[string, string][]>('get_items', { itemType: 'book' }),
        invoke<[string, string][]>('get_items', { itemType: 'note' }),
        invoke<[string, string][]>('get_items', { itemType: 'credential' }),
        invoke<[string, string][]>('get_items', { itemType: 'task' })
      ]);

      const safeParse = (json: string) => {
        try { return JSON.parse(json); } catch { return {}; }
      };

      const loadedBooks = booksItems.map(([id, jsonStr]) => ({ ...safeParse(jsonStr), id } as Book));
      const loadedNotes = notesItems.map(([id, jsonStr]) => ({ ...safeParse(jsonStr), id } as Note));
      const loadedSecrets = secretsItems.map(([id, jsonStr]) => ({ ...safeParse(jsonStr), id } as Credential));
      const loadedTasks = tasksItems.map(([id, jsonStr]) => ({ ...safeParse(jsonStr), id } as Task));

      setBooks(loadedBooks);
      setNotes(loadedNotes);
      setSecrets(loadedSecrets);
      setTasks(loadedTasks);
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  // Auto-Save logic
  const selectedNoteRef = useRef<Note | null>(null);
  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  const handleUpdateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n));
    if (selectedNote?.id === noteId) {
      setSelectedNote(prev => prev ? { ...prev, ...updates, updatedAt: Date.now() } : null);
    }

    // Trigger debounced save
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      const noteToSave = selectedNoteRef.current;
      if (!noteToSave || noteToSave.id !== noteId) return; // Prevent saving if selected note changed

      try {
        const payloadObj = { ...noteToSave };
        delete (payloadObj as any).id;
        await invoke('update_item', { id: noteId, payload: JSON.stringify(payloadObj) });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (e) {
        console.error('Error auto-saving:', e);
        setSaveStatus('idle');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedNote]);

  const handleCreateTask = async () => {
    const newTask: Task = {
      title: 'Nueva Tarea',
      completed: false,
      priority: 'medium',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
 
    try {
      const id = await invoke<string>('save_item', { 
        itemType: 'task', 
        parentId: null, 
        payload: JSON.stringify(newTask) 
      });
      const taskWithId = { ...newTask, id };
      setTasks(prev => [taskWithId, ...prev]);
      setSelectedFilter('tasks');
      setSelectedTaskId(id);
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const handleCreateNote = async (type: 'note' | 'task' = 'note') => {
    if (type === 'task') {
      return handleCreateTask();
    }
    
    if (selectedFilter === 'secrets' || selectedFilter === 'trash' || selectedFilter === 'settings' || selectedFilter === 'tasks') {
      setSelectedFilter('all'); 
    }

    const newNote: Note = {
      bookId: selectedBook?.id || '',
      title: 'New Note',
      content: '',
      contentFormat: 'html',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      const id = await invoke<string>('save_item', {
        itemType: 'note',
        parentId: selectedBook?.id || null,
        payload: JSON.stringify(newNote)
      });
      const noteWithId = { ...newNote, id };
      setNotes(prev => [noteWithId, ...prev]);
      setSelectedNote(noteWithId);
    } catch (e) {
      console.error('Error creating note', e);
    }
  };

  const handleCreateBook = async () => {
    showPrompt(
      'Nuevo Libro',
      'Ingresa el nombre para tu nuevo libro de notas:',
      async (title) => {
        if (!title) return;
        const newBook: Book = { title, createdAt: Date.now() };
        try {
          const id = await invoke<string>('save_item', {
            itemType: 'book',
            parentId: null,
            payload: JSON.stringify(newBook)
          });
          const bookWithId = { ...newBook, id };
          setBooks(prev => [...prev, bookWithId]);
          handleSelectBook(bookWithId);
        } catch (e) {
          console.error('Error creating book', e);
        }
      },
      'Nombre del libro...'
    );
  };

  const handleDeleteNote = async (noteId: string) => {
    showConfirm(
      'Mover a la papelera',
      '¿Estás seguro de que quieres mover esta nota a la papelera?',
      async () => {
        try {
          await invoke('trash_item', { id: noteId });
          setNotes(prev => prev.filter(n => n.id !== noteId));
          if (selectedNote?.id === noteId) setSelectedNote(null);
        } catch (e) {
          console.error('Error trashing note', e);
        }
      },
      'danger'
    );
  };

  // Filter notes based on context
  const getFilteredNotes = () => {
    let filtered = notes.filter(n => !n.isDeleted); // Assume isDeleted logic if applicable

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(q) || 
        (n.content && n.content.toLowerCase().includes(q))
      );
    } else if (selectedTag) {
      filtered = filtered.filter(n => n.tags?.includes(selectedTag));
    } else if (selectedBook) {
      filtered = filtered.filter(n => n.bookId === selectedBook.id);
    } else {
      switch (selectedFilter) {
        case 'all': break;
        case 'favorites': filtered = filtered.filter(n => n.isFavorite); break;
        case 'pinned': filtered = filtered.filter(n => n.isPinned); break;
        case 'tasks': filtered = filtered.filter(n => n.content?.includes('data-type="taskList"')); break;
        case 'uncategorized': filtered = filtered.filter(n => !n.bookId); break;
      }
    }

    // Sort: Pinned first, then by updatedAt
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  };

  const renderMainContent = () => {
    if (selectedFilter === 'secrets') return <SecretsView searchQuery={searchQuery} selectedTag={selectedTag} onShowConfirm={showConfirm} />;
    if (selectedFilter === 'trash') return <TrashView searchQuery={searchQuery} onShowConfirm={showConfirm} />;
    if (selectedFilter === 'settings') return <SettingsView />;
    if (selectedFilter === 'tasks') return (
      <TasksView 
        tasks={tasks} 
        setTasks={setTasks} 
        searchQuery={searchQuery} 
        selectedTag={selectedTag}
        selectedTaskId={selectedTaskId}
        setSelectedTaskId={setSelectedTaskId}
        onShowConfirm={showConfirm}
      />
    );

    return (
      <>
        <NotesList 
          notes={getFilteredNotes()}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          selectedBook={selectedBook}
          selectedFilter={selectedFilter}
          selectedTag={selectedTag}
        />
        <HtmlNoteEditor 
          note={selectedNote}
          books={books}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          saveStatus={saveStatus}
        />
      </>
    );
  };

  const handleNavigate = (filter: string, bookId?: string, itemId?: string) => {
    setSelectedFilter(filter);
    if (bookId) {
      const book = books.find(b => b.id === bookId);
      setSelectedBook(book || null);
    } else {
      setSelectedBook(null);
    }
 
    if (itemId) {
      if (filter === 'all' || bookId) {
        const note = notes.find(n => n.id === itemId);
        setSelectedNote(note || null);
      } else if (filter === 'secrets') {
        // Secrets logic handled by SecretsView state, but we could lift it
      }
    }
  };

  return (
    <div className="app-shell">
      {isLocked && <LockScreen onUnlock={onUnlock} />}
      
      <TopBar 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onLockVault={onLock}
        onSettingsClick={() => handleSelectFilter('settings')}
        onSecretsClick={() => handleSelectFilter('secrets')}
        onNewNote={handleCreateNote}
        onNavigate={handleNavigate}
        notes={notes}
        secrets={secrets}
        tasks={tasks}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="app-body">
        <Sidebar 
          books={books}
          selectedBook={selectedBook}
          onSelectBook={handleSelectBook}
          onCreateBook={handleCreateBook}
          selectedFilter={selectedFilter}
          onSelectFilter={handleSelectFilter}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
          isOpen={isSidebarOpen}
          notes={notes}
          tasks={tasks}
          secrets={secrets}
        />
        
        <div className="app-content">
          {renderMainContent()}
        </div>
      </div>

      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        placeholder={modalConfig.placeholder}
        defaultValue={modalConfig.defaultValue}
      />
    </div>
  );
}
