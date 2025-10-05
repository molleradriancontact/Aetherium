
'use client';

import { useFirebase, useMemoFirebase } from '@/firebase';
import { useAppState } from '@/hooks/use-app-state';
import { ArchitectProject } from '@/app/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface UserProfile {
    projects?: { projectId: string; projectPath: string }[];
}


export function ProjectSwitcher() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { projectId, setProjectId, clearState, projectName } = useAppState();
  const router = useRouter();

  const [allProjects, setAllProjects] = useState<(ArchitectProject & {path: string})[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    if (isUserLoading || !firestore || !user?.uid) {
        if (!isUserLoading) setIsLoadingProjects(false);
        return;
    };

    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
            const userProfileRef = doc(firestore, 'users', user.uid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (!userProfileSnap.exists()) {
                setAllProjects([]);
                return;
            }
            
            const userProfile = userProfileSnap.data() as UserProfile;
            const projectRefs = userProfile.projects || [];

            if (projectRefs.length === 0) {
                setAllProjects([]);
                return;
            }
            
            const projectPromises = projectRefs.map(pRef => getDoc(doc(firestore, pRef.projectPath)));
            const projectSnaps = await Promise.all(projectPromises);
            
            const projects = projectSnaps
                .filter(snap => snap.exists())
                .map(snap => ({ ...snap.data(), id: snap.id, path: snap.ref.path } as ArchitectProject & {path: string}));
            
            projects.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

            setAllProjects(projects);

        } catch (error) {
            console.error("Error fetching projects for switcher:", error);
            setAllProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    }
    fetchProjects();

  }, [user?.uid, firestore, isUserLoading]);


  const handleSelectProject = (selectedProjectId: string) => {
    const project = allProjects?.find(p => p.id === selectedProjectId);
    if (project) {
      setProjectId(project.id, project.path);
      router.push('/');
    }
  };

  const handleNewProject = () => {
    clearState(true); // force nav to /prototype
    router.push('/prototype');
  }

  const isLoading = isUserLoading || isLoadingProjects;

  return (
    <div className="px-2 group-data-[collapsible=icon]:px-0">
        <div className="group-data-[collapsible=icon]:hidden">
            <Select
                onValueChange={handleSelectProject}
                value={projectId || ''}
                disabled={isLoading}
            >
                <SelectTrigger className="w-full h-11 bg-sidebar-accent border-sidebar-border">
                    {isLoading ? (
                        <div className="flex items-center w-full">
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           <span className='truncate'>Loading...</span>
                        </div>
                    ) : (
                        <SelectValue placeholder="Select a project...">
                            {projectName || 'Select a project...'}
                        </SelectValue>
                    )}
                </SelectTrigger>
                <SelectContent>
                    {allProjects && allProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                            {project.name}
                        </SelectItem>
                    ))}
                     <Button variant="ghost" className="w-full justify-start mt-1 h-9" onClick={handleNewProject}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Project
                    </Button>
                </SelectContent>
            </Select>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex">
             <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
                <ChevronsUpDown />
                <span className="sr-only">Switch Project</span>
            </Button>
        </div>
    </div>
  );
}

    