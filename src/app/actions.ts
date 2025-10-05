
'use server';

import { getFirestore, FieldValue, arrayUnion, arrayRemove } from 'firebase-admin/firestore';
import { getAdminApp, getAdminAuth } from '@/firebase/server-init';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { Auth, User } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';

type GeneratedFile = {
    path: string;
    content: string;
};

let db: Firestore;
let auth: Auth;

function getInitializedAdmin() {
    if (!db || !auth) {
        const app = getAdminApp();
        db = getFirestore(app);
        auth = getAdminAuth();
    }
    return { db, auth };
}


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
    
    const { db } = getInitializedAdmin();

    try {
        const projectDocRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectDocRef.get();

        if (!projectDoc.exists) {
            throw new Error("Project not found.");
        }
        
        const projectData = projectDoc.data();
        const collaboratorIds: string[] = projectData?.collaborators || [];

        const batch = db.batch();

        // 1. Delete the project document
        batch.delete(projectDocRef);

        // 2. Remove project reference from each collaborator's profile
        for (const userId of collaboratorIds) {
            const userProfileRef = db.collection('users').doc(userId);
            batch.update(userProfileRef, {
                projects: arrayRemove({ projectId, projectPath: projectDocRef.path })
            });
        }
        
        await batch.commit();
        
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
    const { auth } = getInitializedAdmin();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
}

export async function addCollaborator(projectId: string, collaboratorEmail: string) {
    if (!projectId || !collaboratorEmail) {
        throw new Error("Project ID and Collaborator Email are required.");
    }
    
    const { db, auth } = getInitializedAdmin();
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
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) {
            throw new Error("Project not found.");
        }
        const projectData = projectDoc.data()!;

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


export async function removeCollaborator(projectId: string, collaboratorId: string) {
    if (!projectId || !collaboratorId) {
        throw new Error("Project ID and Collaborator ID are required.");
    }
    
    const { db } = getInitializedAdmin();

    try {
        const projectRef = db.collection('projects').doc(projectId);
        const userProfileRef = db.collection('users').doc(collaboratorId);

        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) throw new Error("Project not found.");
        
        const collaboratorDetails = projectDoc.data()?.collaboratorDetails.find((c: any) => c.id === collaboratorId);

        const batch = db.batch();

        batch.update(projectRef, {
            collaborators: arrayRemove(collaboratorId),
            collaboratorDetails: arrayRemove(collaboratorDetails)
        });

        batch.update(userProfileRef, {
            projects: arrayRemove({ projectId, projectPath: projectRef.path })
        });
        
        await batch.commit();

        revalidatePath('/collaboration');
        revalidatePath(`/projects`); // To refresh user's project list if they are removed
        return { success: true };
    } catch (error) {
        console.error("Failed to remove collaborator:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(errorMessage);
    }
}

export async function acceptInvitation(invitationId: string) {
    const { db } = getInitializedAdmin();
    const userId = await getUserIdFromToken();

    const invitationRef = db.collection('users').doc(userId).collection('invitations').doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
        throw new Error("Invitation not found or has expired.");
    }
    const invitationData = invitationDoc.data()!;
    const projectId = invitationData.projectId;
    
    const projectRef = db.collection('projects').doc(projectId);
    const userProfileRef = db.collection('users').doc(userId);

    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
        throw new Error("The associated project could not be found.");
    }

    const userProfileDoc = await userProfileRef.get();
    if (!userProfileDoc.exists) {
        throw new Error("Your user profile could not be found.");
    }
    const userProfileData = userProfileDoc.data()!;
    
    const batch = db.batch();

    // 1. Add user to project's collaborators list
    batch.update(projectRef, {
        collaborators: arrayUnion(userId),
        collaboratorDetails: arrayUnion({
            id: userId,
            email: userProfileData.email,
            username: userProfileData.username,
            photoURL: userProfileData.photoURL || null
        })
    });
    
    // 2. Add project reference to user's profile
    batch.update(userProfileRef, {
        projects: arrayUnion({ projectId, projectPath: projectRef.path })
    });

    // 3. Delete invitation
    batch.delete(invitationRef);

    await batch.commit();

    revalidatePath('/invitations');
    revalidatePath('/projects');
    return { success: true };
}


export async function declineInvitation(invitationId: string) {
    const { db } = getInitializedAdmin();
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
