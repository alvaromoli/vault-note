import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'confirm' | 'danger' | 'success' | 'prompt';
  onConfirm?: (value?: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
}

export function Modal({ 
  isOpen, 
  title, 
  message, 
  type = 'info', 
  onConfirm, 
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  placeholder = '',
  defaultValue = ''
}: ModalProps) {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle size={32} color="#ef4444" />;
      case 'success': return <CheckCircle size={32} color="#10b981" />;
      case 'confirm': return <Info size={32} color="#5e6ad2" />;
      default: return <Info size={32} color="#9aa0a6" />;
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onCancel}>
      <div className="modal-container glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          <button className="modal-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          {type === 'prompt' && (
            <input 
              autoFocus
              className="modal-input" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={placeholder}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onConfirm?.(inputValue);
                  onCancel();
                }
              }}
            />
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>{cancelText}</button>
          {onConfirm && (
            <button 
              className={type === 'danger' ? 'btn-primary danger-bg' : 'btn-primary'} 
              onClick={() => { onConfirm(inputValue); onCancel(); }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
