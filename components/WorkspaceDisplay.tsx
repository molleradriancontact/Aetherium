
import React from 'react';
import { WorkspaceTemplateWithId } from '../types';
import FolderTree from './FolderTree';
import { DownloadIcon } from './icons/FileIcons';

interface WorkspaceDisplayProps {
  workspace: WorkspaceTemplateWithId;
  projectName: string;
  onUpdateFolderName: (id: string, newName: string) => void;
  onDownloadZip: () => void;
}

const WorkspaceDisplay: React.FC<WorkspaceDisplayProps> = ({ workspace, projectName, onUpdateFolderName, onDownloadZip }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg shadow-2xl border border-slate-700 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-700 bg-slate-800 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">{projectName}</h2>
          <p className="text-slate-400 mt-1">{workspace.description}</p>
        </div>
        <button
          onClick={onDownloadZip}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 transition-all transform hover:scale-105"
          aria-label="Download workspace as a zip file"
        >
          <DownloadIcon />
          <span>Download .zip</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-600 pb-2">Recommended Folder Structure</h3>
          <div className="text-sm font-mono bg-slate-900 p-4 rounded-md h-96 overflow-y-auto">
            <FolderTree nodes={workspace.structure} onUpdateFolderName={onUpdateFolderName} />
          </div>
        </div>

        <div className="p-6 lg:border-l border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-600 pb-2">{workspace.title === 'Academic Research Project' ? 'Research Paper Sections' : 'Key Principles'}</h3>
           <div className="space-y-4 h-96 overflow-y-auto pr-2">
            {workspace.keyPoints.map((point, index) => (
              <div key={index} className="bg-slate-800 p-3 rounded-lg">
                <h4 className="font-bold text-sky-400">{point.title}</h4>
                <p className="text-slate-400 text-sm mt-1">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDisplay;
