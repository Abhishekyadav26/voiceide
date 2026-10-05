'use client';
import Editor from '@monaco-editor/react';
import { useIde } from '@/lib/store/ide';
import { useDesign } from '@/lib/store/design';
import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';

export function EditorPane(): JSX.Element {
  const { files, activeFile, setFiles, setActiveFile, setDirty, compileResult } = useIde();
  const { mode } = useDesign();
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const active = files.find((f) => f.name === activeFile);

  useEffect(() => {
    const ed = editorRef.current;
    const mon = monacoRef.current;
    if (!ed || !mon) return;
    const markers: editor.IMarkerData[] = [];
    for (const e of [...(compileResult?.errors ?? []), ...(compileResult?.warnings ?? [])]) {
      if (e.file && !activeFile.endsWith(e.file.split('/').pop() ?? '')) continue;
      if (e.file && e.file !== activeFile && !activeFile.includes(e.file)) {
        if (e.file !== activeFile) continue;
      }
      markers.push({
        severity: e.severity === 'error' ? mon.MarkerSeverity.Error : mon.MarkerSeverity.Warning,
        message: e.message, startLineNumber: Math.max(1, e.line), startColumn: Math.max(1, e.column),
        endLineNumber: Math.max(1, e.line), endColumn: Math.max(1, e.column + 1),
      });
    }
    const model = ed.getModel();
    if (model) mon.editor.setModelMarkers(model, 'solc', markers);
  }, [compileResult, activeFile]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-1 px-2 pt-1 overflow-x-auto border-b" style={{ borderColor: 'var(--vs-border)' }} role="tablist" aria-label="Open files">
        {files.map((f) => (
          <button key={f.name} role="tab" aria-selected={activeFile === f.name}
            className="text-xs px-3 py-1.5 rounded-t truncate max-w-40"
            style={{ background: activeFile === f.name ? 'var(--vs-muted)' : 'transparent' }}
            onClick={() => setActiveFile(f.name)}>{f.name}</button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="sol"
          theme={mode === 'dark' ? 'vs-dark' : 'vs'}
          value={active?.content ?? ''}
          onChange={(v) => {
            if (v === undefined) return;
            setFiles(files.map((f) => (f.name === activeFile ? { ...f, content: v } : f)));
            setDirty(true);
          }}
          onMount={(ed, mon) => {
            editorRef.current = ed;
            monacoRef.current = mon;
            mon.languages.register({ id: 'sol' });
            mon.languages.setMonarchTokensProvider('sol', {
              keywords: ['contract', 'function', 'constructor', 'pragma', 'import', 'error', 'revert', 'if', 'else', 'for', 'while', 'return', 'mapping', 'uint256', 'address', 'bool', 'string', 'memory', 'calldata', 'storage', 'external', 'public', 'private', 'internal', 'payable', 'view', 'pure', 'immutable', 'constant', 'is', 'emit', 'event', 'modifier', 'onlyOwner'],
              tokenizer: {
                root: [
                  [/\/\/.*$/, 'comment'], [/\/\*\*.*\*\//, 'comment'],
                  [/"([^"\\]|\\.)*"/, 'string'],
                  [/\b\d+(\.\d+)?\b/, 'number'],
                  [/\b[A-Z][A-Za-z0-9_]*\b/, 'type'],
                  [/\b[a-z_][A-Za-z0-9_]*\b/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
                ],
              },
            } as never);
          }}
          options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false }}
        />
      </div>
    </div>
  );
}

export default EditorPane;
