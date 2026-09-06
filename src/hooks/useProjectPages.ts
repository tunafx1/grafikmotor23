import { useEffect, useState, SetStateAction } from 'react';
import { storage } from '../lib/storage';

/** Generated pages belong to a template, never to the currently visible dropdown. */
export function useProjectPages(templateId: string) {
  const [projects, setProjects] = useState<Record<string, any[]>>(() => {
    try {
      const saved = JSON.parse(storage.getItem('generated_pages_by_template') || 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
      const legacy = JSON.parse(storage.getItem('active_generated_pages') || '[]');
      return Array.isArray(legacy) ? { [templateId]: legacy } : {};
    } catch { return {}; }
  });
  useEffect(() => { storage.setItem('generated_pages_by_template', JSON.stringify(projects)); }, [projects]);
  const pages = projects[templateId] || EMPTY_PAGES;
  const setPages = (value: SetStateAction<any[]>, targetId = templateId) => {
    setProjects(prev => ({ ...prev, [targetId]: typeof value === 'function' ? value(prev[targetId] || []) : value }));
  };
  return [pages, setPages, projects, setProjects] as const;
}
const EMPTY_PAGES: any[] = [];
