import { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { TodoItem } from '../types';

const STORAGE_KEY = 'grafik_motoru_todos_v1';

function loadInitialTodos(): TodoItem[] {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TodoItem => item && typeof item.id === 'string' && typeof item.text === 'string');
  } catch {
    return [];
  }
}

/** A general, fully manual to-do list. No AI, no template linkage — just add/check/reorder/delete. */
export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>(loadInitialTodos);

  useEffect(() => {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string, dueDate?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos(prev => {
      const maxOrder = prev.reduce((max, t) => Math.max(max, t.order), -1);
      const item: TodoItem = {
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: trimmed,
        done: false,
        createdAt: Date.now(),
        dueDate: dueDate || undefined,
        order: maxOrder + 1,
      };
      return [...prev, item];
    });
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const updateTodo = (id: string, updates: Partial<Pick<TodoItem, 'text' | 'dueDate'>>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.done));
  };

  const moveTodo = (id: string, direction: 'up' | 'down') => {
    setTodos(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(t => t.id === id);
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= sorted.length) return prev;
      const a = sorted[index];
      const b = sorted[swapWith];
      const aOrder = a.order;
      a.order = b.order;
      b.order = aOrder;
      return prev.map(t => t.id === a.id ? a : t.id === b.id ? b : t);
    });
  };

  const pendingCount = todos.filter(t => !t.done).length;

  return { todos, addTodo, toggleTodo, updateTodo, deleteTodo, clearCompleted, moveTodo, pendingCount };
}
