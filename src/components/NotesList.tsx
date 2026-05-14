import type { Note, Book } from '../types';
import { useLanguage } from '../i18n';
import { Star, Pin } from 'lucide-react';
import './NotesList.css';

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  selectedBook: Book | null;
  selectedFilter: string;
  selectedTag: string | null;
}

export function NotesList({
  notes,
  selectedNote,
  onSelectNote,
  selectedBook,
  selectedFilter,
  selectedTag
}: NotesListProps) {
  const { t } = useLanguage();
  // Strip HTML for excerpt
  const extractText = (html: string) => {
    if (!html) return '';
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const getContextTitle = () => {
    if (selectedTag) return `# ${selectedTag}`;
    if (selectedBook) return selectedBook.title;
    switch (selectedFilter) {
      case 'all': return t('sidebar_all_notes');
      case 'favorites': return t('sidebar_favorites');
      case 'pinned': return t('sidebar_pinned');
      case 'tasks': return t('sidebar_tasks');
      case 'uncategorized': return t('sidebar_uncategorized');
      case 'trash': return t('sidebar_trash');
      default: return t('notes_title');
    }
  };

  const getEmptyMessage = () => {
    switch (selectedFilter) {
      case 'tasks': return t('tasks_empty');
      case 'favorites': return t('favorites_empty');
      case 'trash': return t('trash_empty');
      default: return t('notes_empty');
    }
  };

  return (
    <div className="notes-list-panel">
      <div className="panel-header">
        <h3>{getContextTitle()}</h3>
        <span className="note-count">{notes.length} {t('notes_title').toLowerCase()}</span>
      </div>

      <div className="list-container">
        {notes.length === 0 ? (
          <div className="empty-msg">{getEmptyMessage()}</div>
        ) : (
          notes.map(n => (
            <div 
              key={n.id} 
              className={`note-list-item ${selectedNote?.id === n.id ? 'active' : ''}`}
              onClick={() => onSelectNote(n)}
            >
              <div className="note-item-header">
                <span className="note-item-title">{n.title || t('new_note_default_title')}</span>
                <div className="note-item-icons">
                  {n.isPinned && <Pin size={12} className="icon-pinned" />}
                  {n.isFavorite && <Star size={12} className="icon-favorite" />}
                </div>
              </div>
              <div className="note-item-excerpt">
                {extractText(n.content).substring(0, 80)}...
              </div>
              <div className="note-item-date">
                {new Date(n.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
