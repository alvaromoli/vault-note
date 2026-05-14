import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify';
import type { Note, Book } from '../types';
import { HtmlEditorToolbar } from './HtmlEditorToolbar';
import { Star, Pin, Trash2, Tag, FileText, Folder, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n';
import './HtmlNoteEditor.css';

interface HtmlNoteEditorProps {
  note: Note | null;
  books: Book[];
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

export function HtmlNoteEditor({ note, books, onUpdateNote, onDeleteNote, saveStatus }: HtmlNoteEditorProps) {
  const { t } = useLanguage();
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  
  // Track updates to prevent circular dependencies in useEffect
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: note?.contentFormat === 'html' ? note.content : (note?.content ? `<p>${note.content.replace(/\n/g, '<br/>')}</p>` : ''),
    onUpdate: ({ editor }) => {
      if (!note || isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      const html = editor.getHTML();
      const sanitized = DOMPurify.sanitize(html);
      onUpdateNote(note.id!, { content: sanitized, contentFormat: 'html' });
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    },
  });

  // Sync external changes to the editor (e.g. selecting a new note)
  useEffect(() => {
    // @ts-ignore
    if (editor && note && note.id !== editor.storage.noteId) {
      // @ts-ignore
      editor.storage.noteId = note.id; // custom storage to track which note is loaded
      isUpdatingRef.current = true;
      
      const newContent = note.contentFormat === 'html' 
        ? note.content 
        : (note.content ? `<p>${note.content.replace(/\n/g, '<br/>')}</p>` : '');
        
      editor.commands.setContent(newContent);
      setIsCodeView(false); // Reset view mode when switching notes
      
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    }
  }, [note, editor]);

  // Handle HTML Code editing
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeContent(e.target.value);
    if (note) {
      isUpdatingRef.current = true;
      const sanitized = DOMPurify.sanitize(e.target.value);
      onUpdateNote(note.id!, { content: sanitized, contentFormat: 'html' });
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    }
  };

  const toggleCodeView = () => {
    if (!isCodeView) {
      setCodeContent(editor?.getHTML() || '');
    } else {
      editor?.commands.setContent(DOMPurify.sanitize(codeContent));
    }
    setIsCodeView(!isCodeView);
  };

  if (!note) {
    return (
      <div className="editor-empty-state">
        <div className="empty-content glass-panel">
          <div className="empty-icon-wrapper">
            <FileText size={48} strokeWidth={1} />
          </div>
          <h3>{t('select_note_first')}</h3>
          <p>Selecciona una nota de la lista para ver su contenido o crea una nueva para empezar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="html-note-editor">
      <div className="editor-header-meta">
        <div className="book-selector-container">
          <div 
            className="book-badge-toggle"
            onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
          >
            <Folder size={14} />
            <span className="current-book-label">
              {(books || []).find(b => b.id === note.bookId)?.title || 'Sin Categoría'}
            </span>
            <ChevronDown size={12} className={isBookDropdownOpen ? 'rotated' : ''} />
          </div>

          {isBookDropdownOpen && (
            <div className="book-dropdown-menu glass-panel animate-fade-in">
              <div 
                className={`book-option ${!note.bookId ? 'active' : ''}`}
                onClick={() => {
                  onUpdateNote(note.id!, { bookId: '' });
                  setIsBookDropdownOpen(false);
                }}
              >
                Sin Categoría
              </div>
              {(books || []).map(book => (
                <div 
                  key={book.id} 
                  className={`book-option ${note.bookId === book.id ? 'active' : ''}`}
                  onClick={() => {
                    onUpdateNote(note.id!, { bookId: book.id });
                    setIsBookDropdownOpen(false);
                  }}
                >
                  {book.title}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="title-actions-row">
          <input 
            className="note-title-input"
            value={note.title}
            onChange={(e) => onUpdateNote(note.id!, { title: e.target.value })}
            placeholder={t('note_title_placeholder')}
          />
          <div className="note-actions">
            <button 
              className={`action-btn ${note.isPinned ? 'active' : ''}`}
              onClick={() => onUpdateNote(note.id!, { isPinned: !note.isPinned })}
              title={t('editor_pin_note')}
            >
              <Pin size={18} />
            </button>
            <button 
              className={`action-btn ${note.isFavorite ? 'active' : ''}`}
              onClick={() => onUpdateNote(note.id!, { isFavorite: !note.isFavorite })}
              title={t('editor_favorite_note')}
            >
              <Star size={18} />
            </button>
            <button 
              className="action-btn danger-hover"
              onClick={() => onDeleteNote(note.id!)}
              title={t('editor_trash_note')}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="editor-status-bar">
        <div className="status-meta">
          <span>{new Date(note.updatedAt).toLocaleString()}</span>
        </div>
        <div className="save-status">
          {saveStatus === 'saving' && <span className="status-saving">{t('saving_status')}</span>}
          {saveStatus === 'saved' && <span className="status-saved">{t('saved_status')}</span>}
        </div>
      </div>

      <div className="tag-editor-section">
        <div className="tag-pills-container">
          {(note.tags || []).map(tag => (
            <span key={tag} className="tag-pill">
              {tag}
              <button 
                className="remove-tag" 
                onClick={() => {
                  const newTags = (note.tags || []).filter(t => t !== tag);
                  onUpdateNote(note.id!, { tags: newTags });
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input 
            className="tag-pill-input"
            placeholder="Añadir etiqueta..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val && !(note.tags || []).includes(val)) {
                  const newTags = [...(note.tags || []), val];
                  onUpdateNote(note.id!, { tags: newTags });
                  e.currentTarget.value = '';
                }
              }
            }}
          />
        </div>
        <span className="tag-hint">Presiona Enter para agregar una etiqueta</span>
      </div>

      <HtmlEditorToolbar 
        editor={editor} 
        onToggleCodeView={toggleCodeView} 
        isCodeView={isCodeView} 
      />

      <div className="editor-content-container">
        {isCodeView ? (
          <textarea
            className="html-code-textarea"
            value={codeContent}
            onChange={handleCodeChange}
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} className="tiptap-editor" />
        )}
      </div>
    </div>
  );
}
