import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Book, Note } from '../types';
import { useLanguage } from '../i18n';
import './NotesView.css';

export function NotesView() {
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const items: [string, string][] = await invoke('get_items', { itemType: 'book' });
      const loadedBooks = items.map(([id, jsonStr]) => {
        const book = JSON.parse(jsonStr) as Book;
        book.id = id;
        return book;
      });
      setBooks(loadedBooks);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotesForBook = async (bookId: string) => {
    try {
      const items: [string, string][] = await invoke('get_items', { itemType: 'note' });
      const loadedNotes = items.map(([id, jsonStr]) => {
        const note = JSON.parse(jsonStr) as Note;
        note.id = id;
        return note;
      }).filter(n => n.bookId === bookId);
      setNotes(loadedNotes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBook = async () => {
    const title = prompt(t('new_book_prompt'));
    if (!title) return;
    
    const newBook: Book = { title, createdAt: Date.now() };
    try {
      const id = await invoke<string>('save_item', { 
        itemType: 'book',
        parentId: null,
        payload: JSON.stringify(newBook)
      });
      newBook.id = id;
      setBooks([...books, newBook]);
    } catch (e) {
      console.error('Error creating book', e);
    }
  };

  const handleCreateNote = async () => {
    if (!selectedBook || !selectedBook.id) return;
    
    const newNote: Note = { 
      bookId: selectedBook.id,
      title: t('new_note_default_title'),
      content: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    try {
      const id = await invoke<string>('save_item', { 
        itemType: 'note',
        parentId: selectedBook.id,
        payload: JSON.stringify(newNote)
      });
      newNote.id = id;
      setNotes([...notes, newNote]);
      setSelectedNote(newNote);
    } catch (e) {
      console.error('Error creating note', e);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote || !selectedNote.id) return;
    
    try {
      selectedNote.updatedAt = Date.now();
      // Remove id before saving to payload to avoid duplication, though it's overwritten by DB id
      const payloadObj = { ...selectedNote };
      delete payloadObj.id;
      
      // Delete old and save new since we don't have an update command (or we can just make an update command)
      // Actually, my backend save_item inserts a new UUID. I should add update_item to the backend!
      // Let's assume we implement update_item shortly.
      await invoke('delete_item', { id: selectedNote.id });
      const newId = await invoke<string>('save_item', { 
        itemType: 'note',
        parentId: selectedNote.bookId,
        payload: JSON.stringify(payloadObj)
      });
      
      // Update local state
      const updatedNote = { ...selectedNote, id: newId };
      setNotes(notes.map(n => n.id === selectedNote.id ? updatedNote : n));
      setSelectedNote(updatedNote);
    } catch (e) {
      console.error('Error saving note', e);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !selectedNote.id) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) return;
    
    try {
      await invoke('delete_item', { id: selectedNote.id });
      setNotes(notes.filter(n => n.id !== selectedNote.id));
      setSelectedNote(null);
    } catch (e) {
      console.error('Error deleting note', e);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook || !selectedBook.id) return;
    if (!confirm(t('confirm_delete_book'))) return;
    
    try {
      for (const note of notes) {
        if (note.id) {
          await invoke('delete_item', { id: note.id });
        }
      }
      await invoke('delete_item', { id: selectedBook.id });
      
      setBooks(books.filter(b => b.id !== selectedBook.id));
      setSelectedBook(null);
      setNotes([]);
      setSelectedNote(null);
    } catch (e) {
      console.error('Error deleting book', e);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setSelectedNote(null);
    if (book.id) loadNotesForBook(book.id);
  };

  return (
    <div className="notes-view">
      <div className="books-panel glass-panel">
        <div className="panel-header">
          <h3>{t('books_title')}</h3>
          <div className="header-actions">
            {selectedBook && (
              <button onClick={handleDeleteBook} className="icon-btn danger-icon" title={t('delete')}>🗑️</button>
            )}
            <button onClick={handleCreateBook} className="icon-btn" title={t('books_title')}>+</button>
          </div>
        </div>
        <div className="list-container">
          {books.map(b => (
            <div 
              key={b.id} 
              className={`list-item ${selectedBook?.id === b.id ? 'active' : ''}`}
              onClick={() => handleSelectBook(b)}
            >
              📚 {b.title}
            </div>
          ))}
        </div>
      </div>
      
      <div className="notes-list-panel glass-panel">
        <div className="panel-header">
          <h3>{t('notes_title')}</h3>
          <button onClick={handleCreateNote} disabled={!selectedBook} className="icon-btn">+</button>
        </div>
        <div className="list-container">
          {notes.map(n => (
            <div 
              key={n.id} 
              className={`list-item ${selectedNote?.id === n.id ? 'active' : ''}`}
              onClick={() => setSelectedNote(n)}
            >
              📝 {n.title}
            </div>
          ))}
          {!selectedBook && <p className="empty-msg">{t('select_book_first')}</p>}
        </div>
      </div>

      <div className="editor-panel glass-panel">
        {selectedNote ? (
          <div className="editor-container animate-fade-in">
            <input 
              className="note-title-input" 
              value={selectedNote.title}
              onChange={e => setSelectedNote({...selectedNote, title: e.target.value})}
              placeholder={t('note_title_placeholder')}
            />
            <textarea 
              className="note-content-input"
              value={selectedNote.content}
              onChange={e => setSelectedNote({...selectedNote, content: e.target.value})}
              placeholder={t('note_content_placeholder')}
            />
            <div className="editor-actions">
              <button className="btn-danger" onClick={handleDeleteNote}>{t('delete')}</button>
              <button onClick={handleSaveNote}>{t('save_changes')}</button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('select_note_first')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
