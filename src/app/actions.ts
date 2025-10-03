'use server';

import { doc, deleteDoc } from 'firebase/firestore';
import { getSdks } from '@/firebase'; // Assuming a server-side init is available
import { revalidatePath } from 'next/cache';


type GeneratedFile = {
    path: string;
    content: string;
};

/**
 * This server action is a placeholder.
 * In the Firebase Studio environment, when a user requests to apply changes,
 * the AI agent will directly receive this information and use its own tools
 * to write to the filesystem. This function simulates that handoff.
 */
export async function applyCodeChanges(files: GeneratedFile[]) {
    console.log("AI Agent: Received request to apply code changes.");
    console.log("AI Agent: The following files would be written to the filesystem:");
    files.forEach(file => {
        console.log(`- ${file.path}`);
    });
    // In the real flow, the AI agent's file-writing tool would be invoked here.
    // Since this is a server action, we can't directly trigger the tool,
    // but this simulates the point where the agent takes over.
    return { success: true };
}


export async function deleteProject(userId: string, projectId: string) {
    if (!userId || !projectId) {
        throw new Error("User ID and Project ID are required.");
    }

    try {
        // We're using the client SDK flavor here for simplicity,
        // but in a real-world server action you'd use the Admin SDK.
        // The getSdks function will need to be adapted for server-side use.
        const { firestore } = getSdks();
        const projectDocRef = doc(firestore, 'users', userId, 'projects', projectId);
        await deleteDoc(projectDocRef);
        
        // Revalidate the paths to trigger a data refresh on the client
        revalidatePath('/projects');
        revalidatePath('/chats');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        // Throwing the error to be caught by the client-side caller
        throw new Error(errorMessage);
    }
}
