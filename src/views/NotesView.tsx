import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Book, Note } from '../types';
import { useLanguage } from '../i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './NotesView.css';

export function NotesView() {
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('split');
  const { t } = useLanguage();
  
  // Ref para tener siempre la versión más reciente en el timeout
  const selectedNoteRef = useRef<Note | null>(null);
  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  useEffect(() => {
    loadBooks();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!selectedNote || !selectedNote.id) return;

    const timeout = setTimeout(() => {
      handleAutoSave();
    }, 500); // Reducido a 500ms para mayor seguridad

    return () => clearTimeout(timeout);
  }, [selectedNote?.title, selectedNote?.content]);

  const handleAutoSave = async () => {
    const noteToSave = selectedNoteRef.current;
    if (!noteToSave || !noteToSave.id) return;
    
    setSaveStatus('saving');
    try {
      const payloadObj = { 
        ...noteToSave,
        updatedAt: Date.now() 
      };
      const id = payloadObj.id;
      delete (payloadObj as any).id;
      
      await invoke('update_item', { 
        id: id,
        payload: JSON.stringify(payloadObj)
      });

      // Actualizamos primero la lista y luego el estado de "guardado"
      const updatedNote = { ...noteToSave, id };
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e) {
      console.error('CRITICAL: Error auto-saving note', e);
      setSaveStatus('idle');
      // Si falla el auto-guardado, mostramos una alerta para no perder datos
      alert("Error al guardar la nota automáticamente: " + e);
    }
  };

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
    // Already handled by auto-save, but keeping it for manual force save if needed
    await handleAutoSave();
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !selectedNote.id) return;
    if (!confirm(t('confirm_delete_note'))) return;
    
    try {
      await invoke('trash_item', { id: selectedNote.id });
      setNotes(notes.filter(n => n.id !== selectedNote.id));
      setSelectedNote(null);
    } catch (e) {
      console.error('Error trashing note', e);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook || !selectedBook.id) return;
    if (!confirm(t('confirm_delete_book'))) return;
    
    try {
      // Trash all notes in the book
      for (const note of notes) {
        if (note.id) {
          await invoke('trash_item', { id: note.id });
        }
      }
      // Trash the book itself
      await invoke('trash_item', { id: selectedBook.id });
      
      setBooks(books.filter(b => b.id !== selectedBook.id));
      setSelectedBook(null);
      setNotes([]);
      setSelectedNote(null);
    } catch (e) {
      console.error('Error trashing book', e);
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
            <div className="editor-header">
              <input 
                className="note-title-input" 
                value={selectedNote.title}
                onChange={e => setSelectedNote({...selectedNote, title: e.target.value})}
                placeholder={t('note_title_placeholder')}
              />
              <div className="mode-toggle">
                <button 
                  className={editorMode === 'edit' ? 'active' : ''} 
                  onClick={() => setEditorMode('edit')}
                >
                  {t('edit_mode')}
                </button>
                <button 
                  className={editorMode === 'split' ? 'active' : ''} 
                  onClick={() => setEditorMode('split')}
                >
                  {t('split_mode')}
                </button>
                <button 
                  className={editorMode === 'preview' ? 'active' : ''} 
                  onClick={() => setEditorMode('preview')}
                >
                  {t('preview_mode')}
                </button>
              </div>
            </div>

            <div className={`editor-body ${editorMode}`}>
              {(editorMode === 'edit' || editorMode === 'split') && (
                <textarea 
                  className="note-content-input"
                  value={selectedNote.content}
                  onChange={e => setSelectedNote({...selectedNote, content: e.target.value})}
                  placeholder={t('note_content_placeholder')}
                />
              )}
              
              {(editorMode === 'preview' || editorMode === 'split') && (
                <div className="markdown-preview">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {selectedNote.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="editor-actions">
              <div className="save-status">
                {saveStatus === 'saving' && <span className="status-saving">● {t('saving_status')}</span>}
                {saveStatus === 'saved' && <span className="status-saved">✓ {t('saved_status')}</span>}
              </div>
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
