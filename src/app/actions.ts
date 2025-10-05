
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAdminApp, getAdminAuth } from '@/firebase/server-init';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

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


export async function deleteProject(projectId: string) {
    if (!projectId) {
        throw new Error("Project ID is required.");
    }
    
    const adminDb = getFirestore(getAdminApp());

    try {
        const projectQuery = await adminDb.collectionGroup('projects').where('id', '==', projectId).limit(1).get();

        if (projectQuery.empty) {
            throw new Error("Project not found.");
        }

        const projectDocRef = projectQuery.docs[0].ref;
        await projectDocRef.delete();
        
        revalidatePath('/projects');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}

async function getUserIdFromToken() {
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    if (!authorization) {
        throw new Error("Unauthorized: No user token provided.");
    }
    const token = authorization.split('Bearer ')[1];
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
}

export async function addCollaborator(projectId: string, collaboratorEmail: string) {
    if (!projectId || !collaboratorEmail) {
        throw new Error("Project ID and Collaborator Email are required.");
    }
    
    const db = getFirestore(getAdminApp());
    const auth = getAdminAuth();
    const invitingUserId = await getUserIdFromToken();

    try {
        // 1. Find the user being invited
        const invitedUserRecord = await auth.getUserByEmail(collaboratorEmail);
        const invitedUserId = invitedUserRecord.uid;

        // 2. Find the inviting user's profile to get their username
        const invitingUserDoc = await db.collection('users').doc(invitingUserId).get();
        if (!invitingUserDoc.exists) {
            throw new Error("Inviting user's profile not found.");
        }
        const invitingUsername = invitingUserDoc.data()?.username || 'A user';

        // 3. Find the project document
        const projectQuery = await db.collectionGroup('projects').where('id', '==', projectId).limit(1).get();
        if (projectQuery.empty) {
            throw new Error("Project not found.");
        }
        const projectDoc = projectQuery.docs[0];
        const projectData = projectDoc.data();

        if (projectData.userId === invitedUserId) {
            throw new Error("You cannot invite the project owner.");
        }
        if (projectData.collaborators?.includes(invitedUserId)) {
            throw new Error("This user is already a collaborator on this project.");
        }

        // 4. Create the invitation document in the user's "invitations" sub-collection
        const invitationRef = db.collection('users').doc(invitedUserId).collection('invitations').doc();
        const newInvitation = {
            id: invitationRef.id,
            projectId: projectId,
            projectName: projectData.name,
            invitedByUserId: invitingUserId,
            invitedByUsername: invitingUsername,
            invitedUserEmail: collaboratorEmail,
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
        };

        await invitationRef.set(newInvitation);
        
        revalidatePath('/collaboration');
        return { success: true, invitationId: invitationRef.id };

    } catch (error: any) {
        console.error("Failed to add collaborator:", error);
        if (error.code === 'auth/user-not-found') {
            throw new Error("User with this email does not exist.");
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}


export async function removeCollaborator(projectId: string, collaboratorId: string, collaboratorDetails: any) {
    if (!projectId || !collaboratorId) {
        throw new Error("Project ID, and Collaborator ID are required.");
    }
    
    const db = getFirestore(getAdminApp());

    try {
        const projectQuery = await db.collectionGroup('projects').where('id', '==', projectId).limit(1).get();

        if (projectQuery.empty) {
            throw new Error("Project not found.");
        }

        const projectRef = projectQuery.docs[0].ref;
        
        const updates = {
            collaborators: FieldValue.arrayRemove(collaboratorId),
            collaboratorDetails: FieldValue.arrayRemove(collaboratorDetails)
        };
        
        await projectRef.update(updates);

        revalidatePath('/collaboration');
        return { success: true };
    } catch (error) {
        console.error("Failed to remove collaborator:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}

export async function acceptInvitation(invitationId: string) {
    const db = getFirestore(getAdminApp());
    const userId = await getUserIdFromToken();

    const invitationRef = db.collection('users').doc(userId).collection('invitations').doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
        throw new Error("Invitation not found or has expired.");
    }
    const invitationData = invitationDoc.data()!;

    // Find project
    const projectQuery = await db.collectionGroup('projects').where('id', '==', invitationData.projectId).limit(1).get();
    if (projectQuery.empty) {
        throw new Error("The associated project could not be found.");
    }
    const projectRef = projectQuery.docs[0].ref;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error("Your user profile could not be found.");
    }
    const userData = userDoc.data()!;

    // Add user to collaborators
    await projectRef.update({
        collaborators: FieldValue.arrayUnion(userId),
        collaboratorDetails: FieldValue.arrayUnion({
            id: userId,
            email: userData.email,
            username: userData.username,
            photoURL: userData.photoURL || null
        })
    });
    
    // Delete invitation
    await invitationRef.delete();

    revalidatePath('/invitations');
    revalidatePath('/projects');
    return { success: true };
}


export async function declineInvitation(invitationId: string) {
    const db = getFirestore(getAdminApp());
    const userId = await getUserIdFromToken();
    
    const invitationRef = db.collection('users').doc(userId).collection('invitations').doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
        // It might have already been processed, so we can fail silently.
        console.log("Invitation not found, may have already been declined or accepted.");
        return { success: true };
    }

    await invitationRef.delete();

    revalidatePath('/invitations');
    return { success: true };
}
