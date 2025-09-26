import React from 'react';
import { WorkspaceNodeWithId } from '../types';
import { FolderIcon, FileIcon } from './icons/FileIcons';

interface FolderTreeProps {
  nodes: WorkspaceNodeWithId[];
  onUpdateFolderName: (id: string, newName: string) => void;
  level?: number;
}

const FolderTree: React.FC<FolderTreeProps> = ({ nodes, onUpdateFolderName, level = 0 }) => {
  return (
    <div>
      {nodes.map((node) => {
        const Icon = node.type === 'folder' ? FolderIcon : FileIcon;

        return (
          <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
            <div className="relative flex items-center gap-2 py-1 hover:bg-slate-800/50 rounded px-1 group w-full">
              <Icon />
              
              {node.type === 'folder' ? (
                <input
                  type="text"
                  value={node.name}
                  onChange={(e) => onUpdateFolderName(node.id, e.target.value)}
                  className="bg-transparent text-sky-400 outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 w-full"
                  aria-label={`Edit folder name ${node.name}`}
                />
              ) : (
                <span className="text-slate-300">{node.name}</span>
              )}
              
              {/* Refined Tooltip for FOLDERS */}
              {node.type === 'folder' && (
                <div className="absolute left-5 top-full z-10 mt-2 w-64 rounded-md bg-slate-800 p-3 text-xs text-slate-300 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none max-h-48 overflow-y-auto">
                  {node.description && (
                    <p className="font-bold pb-2 mb-2 border-b border-slate-700">{node.description}</p>
                  )}
                  
                  {node.children && node.children.length > 0 ? (
                    <>
                      <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-2">Contents</h4>
                      <ul className="space-y-1.5">
                        {node.children.map(child => (
                          <li key={`${node.id}-child-${child.id}`} className="flex items-center gap-2 truncate">
                            {child.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                            <span className="truncate">{child.name}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-slate-500 italic">This folder is empty.</p>
                  )}
                </div>
              )}

              {/* Inline description for FILES */}
              {node.type === 'file' && node.description && (
                  <span className="text-xs text-slate-500 italic hidden group-hover:inline ml-auto pr-2 flex-shrink-0"> - {node.description}</span>
              )}
            </div>
            {node.type === 'folder' && node.children && (
              <FolderTree 
                nodes={node.children} 
                onUpdateFolderName={onUpdateFolderName} 
                level={level + 1} 
              />
            )}
          </div>
        )
      })}
    </div>
  );
};

export default FolderTree;