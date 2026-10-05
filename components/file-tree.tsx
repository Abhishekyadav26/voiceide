'use client';
import { useState } from 'react';
import { useIde } from '@/lib/store/ide';

export function FileTree(): JSX.Element {
  const { files, activeFile, setActiveFile, createFile, renameFile, deleteFile } = useIde();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  return (
    <div className="p-2 text-sm">
      <div className="flex items-center justify-between px-1 mb-2">
        <b>Files</b>
        <span className="text-xs opacity-60">{files.length}</span>
      </div>
      <div className="flex gap-1 mb-2">
        <input className="vs-input text-xs" placeholder="NewFile.sol" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) { createFile(newName.trim()); setNewName(''); } }} aria-label="New file name" />
        <button className="vs-btn-ghost text-xs" onClick={() => { if (newName.trim()) { createFile(newName.trim()); setNewName(''); } }}>+</button>
      </div>
      <ul>
        {files.map((f) => (
          <li key={f.name}>
            {editing === f.name ? (
              <input className="vs-input text-xs" value={editVal} autoFocus
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editVal.trim()) { renameFile(f.name, editVal.trim()); setEditing(null); }
                  if (e.key === 'Escape') setEditing(null);
                }}
                onBlur={() => setEditing(null)} aria-label="Rename file" />
            ) : (
              <div className="flex items-center gap-1 px-1 py-1 rounded cursor-pointer hover:opacity-80"
                style={{ background: activeFile === f.name ? 'var(--vs-muted)' : 'transparent' }}
                onClick={() => setActiveFile(f.name)}>
                <span className="flex-1 truncate" title={f.name}>📄 {f.name}</span>
                <button className="opacity-60 hover:opacity-100" title="Rename" onClick={(e) => { e.stopPropagation(); setEditing(f.name); setEditVal(f.name); }}>✎</button>
                <button className="opacity-60 hover:opacity-100" title="Delete" onClick={(e) => { e.stopPropagation(); deleteFile(f.name); }}>🗑</button>
              </div>
            )}
          </li>
        ))}
        {files.length === 0 && <li className="text-xs opacity-60 px-1">No files yet — create one above.</li>}
      </ul>
    </div>
  );
}
