
'use server';

import { doc, deleteDoc, getFirestore, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { getAdminApp, getAdminAuth } from '@/firebase/server-init';
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
    const db = getFirestore(getAdminApp());

    try {
        const projectDocRef = doc(db, 'users', userId, 'projects', projectId);
        await deleteDoc(projectDocRef);
        
        revalidatePath('/projects');
        revalidatePath('/chats');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}

export async function addCollaborator(ownerId: string, projectId: string, collaboratorEmail: string) {
    if (!ownerId || !projectId || !collaboratorEmail) {
        throw new Error("Owner ID, Project ID, and Collaborator Email are required.");
    }
    
    const db = getFirestore(getAdminApp());
    const auth = getAdminAuth();

    try {
        const userRecord = await auth.getUserByEmail(collaboratorEmail);
        const collaboratorId = userRecord.uid;

        if (ownerId === collaboratorId) {
            throw new Error("You cannot add yourself as a collaborator.");
        }
        
        const projectRef = doc(db, 'users', ownerId, 'projects', projectId);
        
        // Fetch collaborator's user profile to get their username
        const collaboratorUserRef = doc(db, 'users', collaboratorId);
        const collaboratorDoc = await getDoc(collaboratorUserRef);
        if (!collaboratorDoc.exists()) {
            throw new Error("Collaborator's user profile does not exist.");
        }
        const collaboratorData = collaboratorDoc.data();

        await updateDoc(projectRef, {
            collaborators: arrayUnion(collaboratorId),
            collaboratorDetails: arrayUnion({
                id: collaboratorId,
                email: collaboratorData.email,
                username: collaboratorData.username,
                photoURL: collaboratorData.photoURL || null
            })
        });

        revalidatePath('/collaboration');
        return { success: true, collaboratorId: collaboratorId };
    } catch (error: any) {
        console.error("Failed to add collaborator:", error);
        if (error.code === 'auth/user-not-found') {
            throw new Error("User with this email does not exist.");
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}

export async function removeCollaborator(ownerId: string, projectId: string, collaboratorId: string) {
    if (!ownerId || !projectId || !collaboratorId) {
        throw new Error("Owner ID, Project ID, and Collaborator ID are required.");
    }
    
    const db = getFirestore(getAdminApp());

    try {
        const projectRef = doc(db, 'users', ownerId, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            throw new Error("Project not found.");
        }
        
        const projectData = projectDoc.data();
        const collaboratorDetailsToRemove = (projectData.collaboratorDetails || []).find((c: any) => c.id === collaboratorId);

        const updates: any = {
            collaborators: arrayRemove(collaboratorId)
        };

        if (collaboratorDetailsToRemove) {
            updates.collaboratorDetails = arrayRemove(collaboratorDetailsToRemove);
        }
        
        await updateDoc(projectRef, updates);

        revalidatePath('/collaboration');
        return { success: true };
    } catch (error) {
        console.error("Failed to remove collaborator:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}
