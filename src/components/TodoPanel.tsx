import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { TodoItem } from '../types';

interface TodoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  todos: TodoItem[];
  addTodo: (text: string, dueDate?: string) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Pick<TodoItem, 'text' | 'dueDate'>>) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  moveTodo: (id: string, direction: 'up' | 'down') => void;
}

type Filter = 'all' | 'pending' | 'done';

const todayIso = () => new Date().toISOString().slice(0, 10);

function formatDueDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function TodoPanel({ isOpen, onClose, todos, addTodo, toggleTodo, updateTodo, deleteTodo, clearCompleted, moveTodo }: TodoPanelProps) {
  const [draft, setDraft] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = todayIso();
  const sorted = [...todos].sort((a, b) => a.order - b.order);
  const visible = sorted.filter(t => filter === 'all' ? true : filter === 'pending' ? !t.done : t.done);
  const doneCount = todos.filter(t => t.done).length;

  const submitDraft = () => {
    if (!draft.trim()) return;
    addTodo(draft, draftDate || undefined);
    setDraft('');
    setDraftDate('');
  };

  const commitTextEdit = (id: string) => {
    const trimmed = editingTextValue.trim();
    if (trimmed) updateTodo(id, { text: trimmed });
    setEditingTextId(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          className="fixed top-[68px] right-4 z-[9999] flex w-[340px] max-w-[92vw] max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1D1D1F] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.08)] px-4 py-3">
            <div>
              <h3 className="text-[13px] font-bold text-white">Yapılacaklar</h3>
              <p className="mt-0.5 text-[10px] capitalize text-[rgba(255,255,255,0.35)]">
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[rgba(255,255,255,0.5)] transition hover:bg-white/10 hover:text-white"
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          </div>

          {/* Add row */}
          <div className="space-y-2 border-b border-[rgba(255,255,255,0.08)] px-4 py-3">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitDraft(); }}
                placeholder="Yeni görev ekle…"
                className="w-full min-w-0 flex-1 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#121317] px-3 py-2 text-xs text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#FF6B1A]"
              />
              <button
                type="button"
                onClick={submitDraft}
                disabled={!draft.trim()}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#FF6B1A] text-white transition hover:opacity-90 disabled:opacity-30"
                aria-label="Ekle"
              >
                <Plus size={15} />
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-[10px] text-[rgba(255,255,255,0.4)]">
              <CalendarDays size={12} />
              <input
                type="date"
                value={draftDate}
                onChange={e => setDraftDate(e.target.value)}
                className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-transparent px-1.5 py-1 text-[10px] text-[rgba(255,255,255,0.6)] focus:outline-none [color-scheme:dark]"
              />
              {draftDate && (
                <button type="button" onClick={() => setDraftDate('')} className="cursor-pointer text-[rgba(255,255,255,0.35)] hover:text-white">
                  Temizle
                </button>
              )}
            </label>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 px-4 py-2">
            {([['all', 'Tümü'], ['pending', 'Bekleyen'], ['done', 'Tamamlanan']] as [Filter, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  filter === key ? 'bg-[#FF6B1A] text-white' : 'text-[rgba(255,255,255,0.45)] hover:bg-white/5 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
            {visible.length === 0 && (
              <p className="px-3 py-6 text-center text-[11px] leading-relaxed text-[rgba(255,255,255,0.3)]">
                {filter === 'done' ? 'Henüz tamamlanan görev yok.' : filter === 'pending' ? 'Bekleyen görev yok.' : 'Henüz görev eklenmedi.'}
              </p>
            )}
            {visible.map(item => {
              const isOverdue = !!item.dueDate && item.dueDate < today && !item.done;
              return (
                <div key={item.id} className="group flex items-start gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => toggleTodo(item.id)}
                    className={`todo-checkbox mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-md border transition ${
                      item.done ? 'border-[#FF6B1A] bg-[#FF6B1A]' : 'border-[rgba(255,255,255,0.25)] hover:border-[#FF6B1A]'
                    }`}
                    aria-label={item.done ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                  >
                    {item.done && <Check size={11} className="text-white" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    {editingTextId === item.id ? (
                      <input
                        autoFocus
                        value={editingTextValue}
                        onChange={e => setEditingTextValue(e.target.value)}
                        onBlur={() => commitTextEdit(item.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitTextEdit(item.id);
                          if (e.key === 'Escape') setEditingTextId(null);
                        }}
                        className="w-full rounded-lg border border-[#FF6B1A]/50 bg-[#121317] px-2 py-1 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <p
                        onDoubleClick={() => { setEditingTextId(item.id); setEditingTextValue(item.text); }}
                        title="Düzenlemek için çift tıklayın"
                        className={`cursor-text break-words text-[12px] leading-snug ${item.done ? 'text-[rgba(255,255,255,0.35)] line-through' : 'text-white/90'}`}
                      >
                        {item.text}
                      </p>
                    )}

                    <div className="mt-1 flex items-center gap-2">
                      {editingDateId === item.id ? (
                        <input
                          type="date"
                          autoFocus
                          value={item.dueDate || ''}
                          onChange={e => updateTodo(item.id, { dueDate: e.target.value || undefined })}
                          onBlur={() => setEditingDateId(null)}
                          className="rounded-lg border border-[rgba(255,255,255,0.15)] bg-[#121317] px-1.5 py-0.5 text-[10px] text-white focus:outline-none [color-scheme:dark]"
                        />
                      ) : item.dueDate ? (
                        <button
                          type="button"
                          onClick={() => setEditingDateId(item.id)}
                          className={`flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold transition ${
                            isOverdue ? 'bg-red-500/15 text-red-300' : 'bg-white/5 text-[rgba(255,255,255,0.4)] hover:text-white'
                          }`}
                        >
                          <CalendarDays size={9} />
                          {formatDueDate(item.dueDate)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingDateId(item.id)}
                          className="todo-touch-reveal cursor-pointer text-[9px] font-semibold text-[rgba(255,255,255,0.25)] opacity-0 transition group-hover:opacity-100 hover:text-white"
                        >
                          + tarih
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="todo-touch-reveal flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button type="button" onClick={() => moveTodo(item.id, 'up')} className="todo-icon-btn flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[rgba(255,255,255,0.35)] hover:bg-white/10 hover:text-white" aria-label="Yukarı taşı">
                      <ChevronUp size={13} />
                    </button>
                    <button type="button" onClick={() => moveTodo(item.id, 'down')} className="todo-icon-btn flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[rgba(255,255,255,0.35)] hover:bg-white/10 hover:text-white" aria-label="Aşağı taşı">
                      <ChevronDown size={13} />
                    </button>
                    <button type="button" onClick={() => deleteTodo(item.id)} className="todo-icon-btn flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[rgba(255,255,255,0.35)] hover:bg-red-500/15 hover:text-red-300" aria-label="Sil">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {doneCount > 0 && (
            <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-2">
              <button
                type="button"
                onClick={clearCompleted}
                className="w-full cursor-pointer rounded-lg py-1.5 text-center text-[10px] font-semibold text-[rgba(255,255,255,0.4)] transition hover:bg-white/5 hover:text-white"
              >
                Tamamlananları temizle ({doneCount})
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
