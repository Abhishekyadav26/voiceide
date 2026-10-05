import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import type { CompileResult } from '../compiler/types';
import type { Intent } from '../intents/schema';

export interface ProjectFile { name: string; content: string }
export interface Deployment {
  name: string; address: string; abi: unknown[]; constructorArgs: unknown[];
  txHash: string; blockNumber: number; timestamp: number;
}
export interface CommandEntry {
  id: number; text: string; heard: string; understood: string;
  status: 'ok' | 'error' | 'clarify' | 'pending'; time: number;
}
export interface PendingDiff { fileName: string; before: string; after: string; label: string }

interface IdeState {
  files: ProjectFile[];
  activeFile: string;
  dirty: boolean;
  compileResult: CompileResult | null;
  compiling: boolean;
  progress: string;
  deployments: Deployment[];
  commands: CommandEntry[];
  pendingDiff: PendingDiff | null;
  undoStacks: Record<string, string[]>;
  fixAttempts: number;
  explainText: string | null;
  auditText: string | null;
  constructorArgs: Record<string, string[]>;
  hydrated: boolean;

  setFiles: (f: ProjectFile[]) => void;
  upsertFile: (name: string, content: string) => void;
  createFile: (name: string) => void;
  renameFile: (oldName: string, newName: string) => void;
  deleteFile: (name: string) => void;
  setActiveFile: (n: string) => void;
  setDirty: (d: boolean) => void;
  setCompileResult: (r: CompileResult | null) => void;
  setCompiling: (b: boolean, p?: string) => void;
  addDeployment: (d: Deployment) => void;
  logCommand: (c: Omit<CommandEntry, 'id' | 'time'>) => void;
  setPendingDiff: (d: PendingDiff | null) => void;
  pushUndo: (file: string, content: string) => void;
  popUndo: (file: string) => string | null;
  applyIntent: (intent: Intent) => void;
  setExplain: (t: string | null) => void;
  setAudit: (t: string | null) => void;
  setConstructorArgs: (contract: string, args: string[]) => void;
  setFixAttempts: (n: number) => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

const FILES_KEY = 'voicesol:files';
const SETTINGS_KEY = 'voicesol:settings';
const DEPLOY_KEY = 'voicesol:deployments';

let cmdId = 1;

export const useIde = create<IdeState>()((setState, getState) => ({
  files: [],
  activeFile: 'SolCoin.sol',
  dirty: false,
  compileResult: null,
  compiling: false,
  progress: '',
  deployments: [],
  commands: [],
  pendingDiff: null,
  undoStacks: {},
  fixAttempts: 0,
  explainText: null,
  auditText: null,
  constructorArgs: {},
  hydrated: false,

  setFiles: (files) => { setState({ files, dirty: false }); void getState().persist(); },
  upsertFile: (name, content) => {
    const { files } = getState();
    getState().pushUndo(name, files.find((f) => f.name === name)?.content ?? '');
    const exists = files.some((f) => f.name === name);
    const next = exists ? files.map((f) => (f.name === name ? { ...f, content } : f)) : [...files, { name, content }];
    setState({ files: next, dirty: false });
    void getState().persist();
  },
  createFile: (name) => {
    if (getState().files.some((f) => f.name === name)) return;
    setState({ files: [...getState().files, { name, content: '' }], activeFile: name });
    void getState().persist();
  },
  renameFile: (oldName, newName) => {
    setState({
      files: getState().files.map((f) => (f.name === oldName ? { ...f, name: newName } : f)),
      activeFile: getState().activeFile === oldName ? newName : getState().activeFile,
    });
    void getState().persist();
  },
  deleteFile: (name) => {
    const files = getState().files.filter((f) => f.name !== name);
    setState({ files, activeFile: files[0]?.name ?? '' });
    void getState().persist();
  },
  setActiveFile: (activeFile) => setState({ activeFile }),
  setDirty: (dirty) => setState({ dirty }),
  setCompileResult: (compileResult) => setState({ compileResult }),
  setCompiling: (compiling, progress = '') => setState({ compiling, progress }),
  addDeployment: (d) => { setState({ deployments: [...getState().deployments, d] }); void getState().persist(); },
  logCommand: (c) => setState({ commands: [...getState().commands.slice(-99), { ...c, id: cmdId++, time: Date.now() }] }),
  setPendingDiff: (pendingDiff) => setState({ pendingDiff }),
  pushUndo: (file, content) => {
    const stack = getState().undoStacks[file] ?? [];
    setState({ undoStacks: { ...getState().undoStacks, [file]: [...stack, content].slice(-20) } });
  },
  popUndo: (file) => {
    const stack = [...(getState().undoStacks[file] ?? [])];
    const prev = stack.pop();
    if (prev === undefined) return null;
    setState({ undoStacks: { ...getState().undoStacks, [file]: stack } });
    return prev;
  },
  applyIntent: (intent) => {
    if (intent.intent === 'undo') {
      const file = intent.fileName ?? getState().activeFile;
      const prev = getState().popUndo(file);
      if (prev !== null) {
        setState({ files: getState().files.map((f) => (f.name === file ? { ...f, content: prev } : f)) });
        void getState().persist();
      }
    }
  },
  setExplain: (explainText) => setState({ explainText }),
  setAudit: (auditText) => setState({ auditText }),
  setConstructorArgs: (contract, args) => setState({ constructorArgs: { ...getState().constructorArgs, [contract]: args } }),
  setFixAttempts: (fixAttempts) => setState({ fixAttempts }),
  hydrate: async () => {
    try {
      const files = await get<ProjectFile[]>(FILES_KEY);
      const settings = await get<{ activeFile?: string }>(SETTINGS_KEY);
      const deployments = await get<Deployment[]>(DEPLOY_KEY);
      setState({
        files: files ?? [],
        activeFile: settings?.activeFile ?? files?.[0]?.name ?? 'SolCoin.sol',
        deployments: deployments ?? [],
        hydrated: true,
      });
    } catch {
      setState({ hydrated: true });
    }
  },
  persist: async () => {
    const s = getState();
    try {
      await set(FILES_KEY, s.files);
      await set(SETTINGS_KEY, { activeFile: s.activeFile });
      await set(DEPLOY_KEY, s.deployments);
    } catch { /* IndexedDB unavailable */ }
  },
}));
