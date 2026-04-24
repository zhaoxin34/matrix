import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Project {
  id: number;
  name: string;
  code: string;
  status: "active" | "inactive" | "archived";
  role: "admin" | "member";
  created_at: string;
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
        set({ projects });
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
