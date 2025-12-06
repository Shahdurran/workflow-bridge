import { useState, useCallback, useEffect, useRef } from 'react';
import { WorkflowNode, WorkflowConnection, Platform } from '@/types/api';

interface WorkflowState {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  platform: Platform;
}

interface WorkflowHistory {
  past: WorkflowState[];
  present: WorkflowState;
  future: WorkflowState[];
}

interface WorkflowActions {
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (connection: WorkflowConnection) => void;
  deleteConnection: (source: string, target: string) => void;
  clearWorkflow: () => void;
  loadWorkflow: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
  setPlatform: (platform: Platform) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 50;
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'workflow_autosave';

/**
 * Centralized workflow state management hook with undo/redo and persistence
 * 
 * Features:
 * - Undo/Redo with history stack (max 50 actions)
 * - Auto-save to localStorage every 30 seconds
 * - Load from localStorage on mount
 * - All workflow state in one place
 */
export function useWorkflowState(initialPlatform: Platform = 'n8n') {
  const [history, setHistory] = useState<WorkflowHistory>(() => {
    // Try to load from localStorage on mount
    const saved = loadFromStorage();
    if (saved) {
      return {
        past: [],
        present: saved,
        future: [],
      };
    }

    return {
      past: [],
      present: {
        nodes: [],
        connections: [],
        platform: initialPlatform,
      },
      future: [],
    };
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set up auto-save timer
    autoSaveTimerRef.current = setTimeout(() => {
      saveToStorage(history.present);
      setLastSaved(new Date());
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [history.present]);

  // Helper to add state to history
  const pushState = useCallback((newState: WorkflowState) => {
    setHistory(prev => {
      // Add current state to past
      const newPast = [...prev.past, prev.present];
      
      // Limit history size
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new action is taken
      };
    });
  }, []);

  // Actions
  const addNode = useCallback((node: WorkflowNode) => {
    const newState: WorkflowState = {
      ...history.present,
      nodes: [...history.present.nodes, node],
    };
    pushState(newState);
  }, [history.present, pushState]);

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    const newState: WorkflowState = {
      ...history.present,
      nodes: history.present.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    };
    pushState(newState);
  }, [history.present, pushState]);

  const deleteNode = useCallback((nodeId: string) => {
    const newState: WorkflowState = {
      ...history.present,
      nodes: history.present.nodes.filter(n => n.id !== nodeId),
      connections: history.present.connections.filter(
        c => c.source !== nodeId && c.target !== nodeId
      ),
    };
    pushState(newState);
  }, [history.present, pushState]);

  const addConnection = useCallback((connection: WorkflowConnection) => {
    // Check if connection already exists
    const exists = history.present.connections.some(
      c => c.source === connection.source && c.target === connection.target
    );

    if (!exists) {
      const newState: WorkflowState = {
        ...history.present,
        connections: [...history.present.connections, connection],
      };
      pushState(newState);
    }
  }, [history.present, pushState]);

  const deleteConnection = useCallback((source: string, target: string) => {
    const newState: WorkflowState = {
      ...history.present,
      connections: history.present.connections.filter(
        c => !(c.source === source && c.target === target)
      ),
    };
    pushState(newState);
  }, [history.present, pushState]);

  const clearWorkflow = useCallback(() => {
    const newState: WorkflowState = {
      ...history.present,
      nodes: [],
      connections: [],
    };
    pushState(newState);
  }, [history.present, pushState]);

  const loadWorkflow = useCallback((
    nodes: WorkflowNode[],
    connections: WorkflowConnection[]
  ) => {
    const newState: WorkflowState = {
      ...history.present,
      nodes,
      connections,
    };
    pushState(newState);
  }, [history.present, pushState]);

  const setPlatform = useCallback((platform: Platform) => {
    const newState: WorkflowState = {
      ...history.present,
      platform,
    };
    pushState(newState);
  }, [history.present, pushState]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const actions: WorkflowActions = {
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    clearWorkflow,
    loadWorkflow,
    setPlatform,
    undo,
    redo,
    canUndo,
    canRedo,
  };

  return {
    nodes: history.present.nodes,
    connections: history.present.connections,
    platform: history.present.platform,
    actions,
    lastSaved,
  };
}

/**
 * Save workflow to localStorage
 */
function saveToStorage(state: WorkflowState): void {
  try {
    const data = {
      ...state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save workflow to localStorage:', error);
  }
}

/**
 * Load workflow from localStorage
 */
function loadFromStorage(): WorkflowState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    
    // Validate the data structure
    if (data && data.nodes && data.connections && data.platform) {
      return {
        nodes: data.nodes,
        connections: data.connections,
        platform: data.platform,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to load workflow from localStorage:', error);
    return null;
  }
}

/**
 * Clear workflow from localStorage
 */
export function clearWorkflowStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear workflow from localStorage:', error);
  }
}

/**
 * Export workflow as JSON file
 */
export function exportWorkflowToFile(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  platform: Platform,
  filename: string = 'workflow.json'
): void {
  const data = {
    nodes,
    connections,
    platform,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import workflow from JSON file
 */
export function importWorkflowFromFile(
  file: File,
  onSuccess: (nodes: WorkflowNode[], connections: WorkflowConnection[], platform: Platform) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);

      if (!data.nodes || !data.connections) {
        throw new Error('Invalid workflow file format');
      }

      onSuccess(
        data.nodes,
        data.connections,
        data.platform || 'n8n'
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to import workflow');
    }
  };

  reader.onerror = () => {
    onError('Failed to read file');
  };

  reader.readAsText(file);
}

