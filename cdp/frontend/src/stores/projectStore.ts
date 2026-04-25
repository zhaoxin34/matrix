import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Project {
  id: number;
  name: string;
  code: string;
  status: "active" | "inactive" | "archived";
  role?: "admin" | "member";
  created_at?: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      projects: [],

      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },

      setProjects: (projects: Project[]) => {
        set((state) => {
          // If currentProject is not in the new projects list, clear it
          if (
            state.currentProject &&
            !projects.find((p) => p.id === state.currentProject?.id)
          ) {
            return { projects, currentProject: null };
          }
          return { projects };
        });
      },

      clearProjects: () => {
        set({ currentProject: null, projects: [] });
      },
    }),
    {
      name: "project-storage",
      partialize: (state) => ({
        currentProject: state.currentProject,
        projects: state.projects,
      }),
    },
  ),
);
