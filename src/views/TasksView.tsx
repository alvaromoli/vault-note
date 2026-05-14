import { useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Task } from '../types';
import { 
  CheckSquare, Plus, Trash2, Calendar, Flag, Tag, Check, Save 
} from 'lucide-react';
import { useLanguage } from '../i18n';
import './TasksView.css';

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  searchQuery?: string;
  selectedTag?: string | null;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  onShowConfirm: (title: string, message: string, onConfirm: () => void, type?: 'confirm' | 'danger') => void;
}

export function TasksView({ 
  tasks, 
  setTasks, 
  searchQuery = '', 
  selectedTag = null,
  selectedTaskId,
  setSelectedTaskId,
  onShowConfirm
}: TasksViewProps) {
  const { t } = useLanguage();

  const selectedTask = useMemo(() => 
    tasks.find(t => t.id === selectedTaskId) || null
  , [tasks, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    let result = (tasks || []).filter(t => !t.isDeleted);
    
    if (selectedTag) {
      result = result.filter(t => t.tags?.includes(selectedTag));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, searchQuery, selectedTag]);

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t);
    setTasks(updatedTasks);

    const taskToUpdate = updatedTasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      try {
        await invoke('update_item', { 
          id: taskId, 
          payload: JSON.stringify(taskToUpdate) 
        });
      } catch (e) {
        console.error("Error updating task:", e);
      }
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !selectedTask.id) return;
    
    onShowConfirm(
      'Mover a la papelera',
      '¿Mover esta tarea a la papelera?',
      async () => {
        try {
          await invoke('trash_item', { id: selectedTask.id });
          setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
          setSelectedTaskId(null);
        } catch (e) {
          console.error("Error trashing task:", e);
        }
      },
      'danger'
    );
  };

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
      setSelectedTaskId(id);
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const toggleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    handleUpdateTask(task.id!, { completed: !task.completed });
  };

  return (
    <div className="tasks-view">
      <div className="tasks-list-panel glass-panel">
        <div className="tasks-toolbar">
          <h3>{t('sidebar_tasks')}</h3>
          <button className="icon-btn" onClick={handleCreateTask}><Plus size={18} /></button>
        </div>
        <div className="task-list-container">
          {filteredTasks.length === 0 ? (
            <div className="empty-msg">{t('tasks_empty')}</div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className={`task-item ${selectedTaskId === task.id ? 'active' : ''} ${task.completed ? 'completed' : ''}`}
                onClick={() => setSelectedTaskId(task.id!)}
              >
                <div 
                  className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={(e) => toggleComplete(e, task)}
                >
                  {task.completed && <Check size={12} />}
                </div>
                <span className="task-title-text">{task.title}</span>
                {task.priority === 'high' && <Flag size={14} color="#ef4444" />}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="task-detail-panel">
        {selectedTask ? (
          <>
            <div className="task-detail-header">
              <input 
                className="task-detail-title-input"
                value={selectedTask.title}
                onChange={(e) => handleUpdateTask(selectedTask.id!, { title: e.target.value })}
                placeholder="Título de la tarea..."
              />
            </div>
            <div className="task-meta-form">
              <div className="meta-group">
                <label><Flag size={14} /> Prioridad</label>
                <div className="priority-selector">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button 
                      key={p}
                      className={`priority-btn ${selectedTask.priority === p ? `active ${p}` : ''}`}
                      onClick={() => handleUpdateTask(selectedTask.id!, { priority: p })}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="meta-group">
                <label><Tag size={14} /> Etiquetas</label>
                <input 
                  className="secret-input"
                  value={(selectedTask.tags || []).join(', ')}
                  onChange={e => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
                    handleUpdateTask(selectedTask.id!, { tags });
                  }}
                  placeholder="Añadir etiquetas (separadas por comas)..."
                  style={{fontSize: '12px'}}
                />
              </div>

              <div className="meta-group">
                <label><Calendar size={14} /> Fecha de vencimiento</label>
                <input 
                  type="date" 
                  className="secret-input" 
                  onChange={(e) => handleUpdateTask(selectedTask.id!, { dueDate: new Date(e.target.value).getTime() })}
                />
              </div>

              <div style={{marginTop: 'auto', display: 'flex', gap: '10px'}}>
                <button 
                  className="btn-danger-outline" 
                  onClick={handleDeleteTask}
                >
                  <Trash2 size={16} /> {t('delete')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <CheckSquare size={48} strokeWidth={1} />
            </div>
            <h3>Gestor de Tareas</h3>
            <p>Selecciona una tarea de la lista para ver su progreso o editar sus detalles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
