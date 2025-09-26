
import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { ProjectType, WorkspaceNode, WorkspaceTemplateWithId, WorkspaceNodeWithId } from './types';
import { WORKSPACE_TEMPLATES } from './constants/workspaceTemplates';
import ProjectSelector from './components/ProjectSelector';
import WorkspaceDisplay from './components/WorkspaceDisplay';

// Declare saveAs as a global function provided by the script tag in index.html
declare const saveAs: (blob: Blob, filename: string) => void;


const App: React.FC = () => {
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [editableWorkspace, setEditableWorkspace] = useState<WorkspaceTemplateWithId | null>(null);
  const [filesToGenerate, setFilesToGenerate] = useState<{ path: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGenerate = () => {
    if (!projectName || !projectType) return;

    const templateCopy = JSON.parse(JSON.stringify(WORKSPACE_TEMPLATES[projectType]));

    // Add unique IDs to every node for stable keys and reliable updates.
    let idCounter = 0;
    const addIdsToNodes = (nodes: WorkspaceNode[]): WorkspaceNodeWithId[] => {
      return nodes.map(node => {
        const newNode = { ...node, id: `node-${idCounter++}` } as WorkspaceNodeWithId;
        if (newNode.type === 'folder' && 'children' in node && node.children) {
          newNode.children = addIdsToNodes(node.children);
        }
        return newNode;
      });
    };

    const workspaceWithIds: WorkspaceTemplateWithId = {
        ...templateCopy,
        structure: addIdsToNodes(templateCopy.structure),
    };

    setEditableWorkspace(workspaceWithIds);

    // Find all files in the structure to simulate their creation
    const files: { path: string; name: string }[] = [];
    const findFiles = (nodes: WorkspaceNode[], currentPath: string) => {
      nodes.forEach(node => {
        if (node.type === 'file') {
          files.push({ path: currentPath, name: node.name });
        } else if (node.type === 'folder' && node.children) {
          const folderPath = currentPath ? `${currentPath}/${node.name}` : node.name;
          findFiles(node.children, folderPath);
        }
      });
    };

    findFiles(templateCopy.structure, projectName);
    setFilesToGenerate(files);

    if (files.length > 0) {
      const confirmationMessage = `This workspace contains ${files.length} predefined files. Do you want to simulate their creation by logging them to the console?`;
      if (window.confirm(confirmationMessage)) {
        console.log('--- Simulating File Generation ---');
        files.forEach(file => {
          console.log(`Creating file: ${file.path}/${file.name}`);
        });
        console.log('--- Generation Complete ---');
        alert(`${files.length} file paths have been logged to the console.`);
      }
    }
  };

  const handleUpdateFolderName = (id: string, newName: string) => {
    setEditableWorkspace(currentWorkspace => {
      if (!currentWorkspace) return null;

      const updateNodes = (nodes: WorkspaceNodeWithId[]): WorkspaceNodeWithId[] => {
        return nodes.map(node => {
          if (node.id === id) {
            // Found the node to update
            if (node.type === 'folder') {
              return { ...node, name: newName };
            }
            return node; // Should not happen for files, but good practice
          }
          if (node.type === 'folder' && node.children) {
            // Not the node, but might be in its children
            const updatedChildren = updateNodes(node.children);
            // Only create a new object if children actually changed
            if (updatedChildren !== node.children) {
                return { ...node, children: updatedChildren };
            }
          }
          return node; // No change
        });
      };

      return {
        ...currentWorkspace,
        structure: updateNodes(currentWorkspace.structure),
      };
    });
  };

  const handleDownloadZip = () => {
    if (!editableWorkspace || !projectName) return;

    const zip = new JSZip();
    const rootFolder = zip.folder(projectName);
    if (!rootFolder) {
      console.error("Failed to create root folder in zip.");
      return;
    }

    const addNodesToZip = (currentFolder: JSZip, nodes: WorkspaceNodeWithId[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder') {
          const newFolder = currentFolder.folder(node.name);
          if (newFolder && node.children) {
            addNodesToZip(newFolder, node.children);
          }
        } else { // file
          const fileContent = node.content ?? `# ${node.name}\n\nThis file is for: ${node.description}\n`;
          currentFolder.file(node.name, fileContent);
        }
      });
    };

    addNodesToZip(rootFolder, editableWorkspace.structure);

    zip.generateAsync({ type: 'blob' })
      .then(content => {
        saveAs(content, `${projectName}.zip`);
      })
      .catch(err => {
        console.error("Failed to generate zip file:", err);
        alert("An error occurred while generating the zip file. Please check the console for details.");
      });
  };

  const resetWorkspace = () => {
    const confirmation = window.confirm(
      'Are you sure you want to create a new workspace? Your current changes will be lost.'
    );
    if (confirmation) {
      setProjectName('');
      setProjectDescription('');
      setProjectType(null);
      setEditableWorkspace(null);
      setFilesToGenerate([]);
      setSearchQuery('');
    }
  };
  
  const filteredWorkspace = useMemo(() => {
    if (!editableWorkspace) return null;
    if (!searchQuery) return editableWorkspace;

    const lowerCaseQuery = searchQuery.toLowerCase();

    const filterNodes = (nodes: WorkspaceNodeWithId[]): WorkspaceNodeWithId[] => {
      return nodes.reduce<WorkspaceNodeWithId[]>((acc, node) => {
        if (node.type === 'folder') {
          const children = node.children ? filterNodes(node.children) : [];
          const doesFolderNameMatch = node.name.toLowerCase().includes(lowerCaseQuery);

          if (doesFolderNameMatch || children.length > 0) {
            acc.push({ 
              ...node, 
              // Always use the recursively filtered children to maintain a consistent data structure.
              children: children,
            });
          }
        } else { // file
          if (node.name.toLowerCase().includes(lowerCaseQuery)) {
            acc.push(node);
          }
        }
        return acc;
      }, []);
    };

    return {
      ...editableWorkspace,
      structure: filterNodes(editableWorkspace.structure),
    };
  }, [editableWorkspace, searchQuery]);


  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
          Workspace Structure Generator
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Bootstrap your projects with proven organizational structures.
        </p>
      </header>

      <main className="w-full max-w-5xl">
        {!editableWorkspace ? (
          <div className="bg-slate-800/50 rounded-lg shadow-2xl p-6 sm:p-8 border border-slate-700">
            <div className="space-y-6">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-slate-300 mb-2">
                  1. Enter Your Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., 'Quantum Research' or 'Project Nebula'"
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                />
              </div>

               {projectType && (
                 <div>
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-300 mb-2">
                      Project Description (Optional)
                    </label>
                    <textarea
                      id="projectDescription"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      placeholder="Briefly describe the goals and scope of your project."
                      className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    />
                 </div>
               )}

              <div>
                <h2 className="block text-sm font-medium text-slate-300 mb-2">
                  2. Select Workspace Type
                </h2>
                <ProjectSelector selectedType={projectType} onSelect={setProjectType} />
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={!projectName || !projectType}
                  className="px-8 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-lg hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  Generate Workspace
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspace..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                  aria-label="Search workspace"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
             </div>
             {filteredWorkspace && (
                <WorkspaceDisplay 
                    workspace={filteredWorkspace} 
                    projectName={projectName} 
                    onUpdateFolderName={handleUpdateFolderName}
                    onDownloadZip={handleDownloadZip}
                />
             )}
             <button
                onClick={resetWorkspace}
                className="self-center mt-4 px-6 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
             >
                Create Another Workspace
             </button>
          </div>
        )}
      </main>

       <footer className="w-full max-w-5xl text-center mt-12 text-slate-500 text-sm">
          <p>Built for clarity and efficiency in complex projects.</p>
       </footer>
    </div>
  );
};

export default App;
