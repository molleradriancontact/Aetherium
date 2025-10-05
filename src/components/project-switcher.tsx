
'use client';

import { useFirebase, useMemoFirebase } from '@/firebase';
import { useAppState } from '@/hooks/use-app-state';
import { ArchitectProject } from '@/app/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collectionGroup, orderBy, query, where } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function ProjectSwitcher() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { projectId, setProjectId, clearState, projectName } = useAppState();
  const router = useRouter();

  const userProjectsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null; // Wait for user to be loaded
    return query(
      collectionGroup(firestore, 'projects'),
      where('collaborators', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore, isUserLoading]);

  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<ArchitectProject & {path: string}>(userProjectsQuery);


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
