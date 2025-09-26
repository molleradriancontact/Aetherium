import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import type { Mock } from 'jest-mock';
import App from '../App';
import JSZip from 'jszip';

// Mocking JSZip library
const mockZip = {
  folder: jest.fn().mockReturnThis(),
  file: jest.fn().mockReturnThis(),
  generateAsync: jest.fn().mockResolvedValue('blob_content'),
};

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => mockZip);
});

// Mocking the global saveAs function which is defined in jest.setup.ts
declare const saveAs: Mock;

describe('App Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    (JSZip as Mock).mockClear();
    mockZip.folder.mockClear();
    mockZip.file.mockClear();
    mockZip.generateAsync.mockClear();
    saveAs.mockClear();
  });

  const setupWorkspace = async () => {
    render(<App />);
    const user = userEvent.setup();

    // 1. Enter project name
    const projectNameInput = screen.getByPlaceholderText(/e.g., 'Quantum Research' or 'Project Nebula'/i);
    await user.type(projectNameInput, 'Test Project');
    expect(projectNameInput).toHaveValue('Test Project');

    // 2. Select project type
    const researchButton = screen.getByRole('button', { name: /Academic Research/i });
    await user.click(researchButton);

    // 3. Generate workspace
    const generateButton = screen.getByRole('button', { name: /Generate Workspace/i });
    await user.click(generateButton);
  };

  test('renders the initial setup screen correctly', () => {
    render(<App />);
    expect(screen.getByText('Workspace Structure Generator')).toBeInTheDocument();
    expect(screen.getByLabelText(/Enter Your Project Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Workspace/i })).toBeDisabled();
  });

  test('enables generate button only when project name and type are selected', async () => {
    render(<App />);
    const user = userEvent.setup();

    const generateButton = screen.getByRole('button', { name: /Generate Workspace/i });
    expect(generateButton).toBeDisabled();

    const projectNameInput = screen.getByLabelText(/Enter Your Project Name/i);
    await user.type(projectNameInput, 'My Test App');
    expect(generateButton).toBeDisabled();

    const gameDevButton = screen.getByRole('button', { name: /Game Development/i });
    await user.click(gameDevButton);
    expect(generateButton).toBeEnabled();
  });

  describe('Core Logic and State Updates', () => {
    test('should generate the workspace and display the editor view', async () => {
      await setupWorkspace();
      
      // Check if workspace display is visible
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Recommended Folder Structure')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download .zip/i })).toBeInTheDocument();
    });

    test('folder renaming functionality updates the state correctly', async () => {
        await setupWorkspace();
        
        // Find an input field for a folder. Let's target '01_Project_Management'.
        const folderInputs = await screen.findAllByRole('textbox');
        const projectManagementInput = folderInputs.find(input => (input as HTMLInputElement).value === '01_Project_Management');
        
        expect(projectManagementInput).toBeInTheDocument();

        // Rename the folder
        await userEvent.clear(projectManagementInput!);
        await userEvent.type(projectManagementInput!, 'New_Folder_Name');
        
        // Verify the input value has changed
        expect(projectManagementInput).toHaveValue('New_Folder_Name');
    });

    test('reset workspace button returns to the initial screen', async () => {
        await setupWorkspace();
        
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        
        const resetButton = screen.getByRole('button', { name: /Create Another Workspace/i });
        await userEvent.click(resetButton);
        
        // Check if we are back to the setup screen
        expect(screen.getByLabelText(/Enter Your Project Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter Your Project Name/i)).toHaveValue('');
    });
  });

  describe('Integration Tests for Features', () => {
    test('file generation simulation prompts user and logs to console', async () => {
      // Spy on window.confirm and console.log
      const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await setupWorkspace();
      
      // Check that confirm was called
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('predefined files'));

      // Check that console.log was called with file creation messages
      expect(consoleSpy).toHaveBeenCalledWith('--- Simulating File Generation ---');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Creating file: Test Project/01_Project_Management/Project_Proposal.docx'));
      expect(consoleSpy).toHaveBeenCalledWith('--- Generation Complete ---');
      
      // Cleanup spies
      confirmSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test('zip download functionality calls JSZip and saveAs correctly', async () => {
      await setupWorkspace();
      
      // Rename a folder to test if the change is reflected in the zip
      const folderInput = (await screen.findAllByRole('textbox')).find(input => (input as HTMLInputElement).value === '01_Project_Management');
      await userEvent.clear(folderInput!);
      await userEvent.type(folderInput!, 'MODIFIED_FOLDER');
      
      const downloadButton = screen.getByRole('button', { name: /Download .zip/i });
      await userEvent.click(downloadButton);
      
      await waitFor(() => {
        // 1. Check if JSZip was initialized and the root folder was created
        expect(JSZip).toHaveBeenCalledTimes(1);
        expect(mockZip.folder).toHaveBeenCalledWith('Test Project');
        
        // 2. Check if it tried to create the modified folder
        expect(mockZip.folder).toHaveBeenCalledWith('MODIFIED_FOLDER');

        // 3. Check if it tried to create a file
        expect(mockZip.file).toHaveBeenCalledWith('Project_Proposal.docx', expect.any(String));

        // 4. Check if zip generation was triggered
        expect(mockZip.generateAsync).toHaveBeenCalledWith({ type: 'blob' });

        // 5. Check if saveAs was called to trigger the download
        expect(saveAs).toHaveBeenCalledWith('blob_content', 'Test Project.zip');
      });
    });
  });
});
