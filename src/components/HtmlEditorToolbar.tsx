import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3, Pilcrow,
  List, ListOrdered, CheckSquare, 
  Quote, Code, Minus, AlignLeft, AlignCenter, AlignRight,
  Code2, Link as LinkIcon, Unlink, Eraser
} from 'lucide-react';
import { useLanguage } from '../i18n';
import './HtmlEditorToolbar.css';

interface HtmlEditorToolbarProps {
  editor: Editor | null;
  onToggleCodeView: () => void;
  isCodeView: boolean;
}

export function HtmlEditorToolbar({ editor, onToggleCodeView, isCodeView }: HtmlEditorToolbarProps) {
  const { t } = useLanguage();
  if (!editor) {
    return null;
  }

  return (
    <div className="html-editor-toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run() || isCodeView}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run() || isCodeView}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run() || isCodeView}
        className={editor.isActive('underline') ? 'is-active' : ''}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run() || isCodeView}
        className={editor.isActive('strike') ? 'is-active' : ''}
      >
        <Strikethrough size={16} />
      </button>

      <div className="toolbar-divider" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <Heading3 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive('paragraph') ? 'is-active' : ''}
        disabled={isCodeView}
        title="Paragraph"
      >
        <Pilcrow size={16} />
      </button>

      <div className="toolbar-divider" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive('taskList') ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <CheckSquare size={16} />
      </button>

      <div className="toolbar-divider" />

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <AlignLeft size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <AlignCenter size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <AlignRight size={16} />
      </button>

      <div className="toolbar-divider" />

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <Quote size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
        disabled={isCodeView}
      >
        <Code size={16} />
      </button>
      <button
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'is-active' : ''}
        disabled={isCodeView}
        title="Link"
      >
        <LinkIcon size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link') || isCodeView}
        title="Unlink"
      >
        <Unlink size={16} />
      </button>
      <div className="toolbar-divider" />
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        disabled={isCodeView}
        title="Clear Formatting"
      >
        <Eraser size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={isCodeView}
      >
        <Minus size={16} />
      </button>

      <div className="toolbar-spacer" />

      <button 
        className={`code-view-btn ${isCodeView ? 'is-active' : ''}`}
        onClick={onToggleCodeView}
        title={t('editor_code_view')}
      >
        <Code2 size={16} />
        <span>{t('editor_code_view')}</span>
      </button>
    </div>
  );
}
