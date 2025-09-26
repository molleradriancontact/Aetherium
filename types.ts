
export enum ProjectType {
  Research = 'research',
  Game = 'game',
  Custom = 'custom',
}

export interface WorkspaceFile {
  type: 'file';
  name: string;
  description: string;
  // Fix: Add optional content property to WorkspaceFile interface to allow pre-defined content for files like README.md.
  content?: string;
}

export interface WorkspaceFolder {
  type: 'folder';
  name: string;
  description?: string;
  children: WorkspaceNode[];
}

export type WorkspaceNode = WorkspaceFile | WorkspaceFolder;

// New types for state management, including a stable ID for each node.
export interface WorkspaceFileWithId extends WorkspaceFile {
  id: string;
}
export interface WorkspaceFolderWithId extends WorkspaceFolder {
  id: string;
  children: WorkspaceNodeWithId[];
}
export type WorkspaceNodeWithId = WorkspaceFileWithId | WorkspaceFolderWithId;


export interface KeyPrinciple {
    title: string;
    description: string;
}

export interface WorkspaceTemplate {
  title: string;
  description: string;
  structure: WorkspaceNode[];
  keyPoints: KeyPrinciple[];
}

// New type for state management, ensuring the structure contains nodes with IDs.
export interface WorkspaceTemplateWithId extends WorkspaceTemplate {
  structure: WorkspaceNodeWithId[];
}
