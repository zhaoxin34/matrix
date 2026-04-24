import { useState, useEffect } from "react";
import { Select, Space, Badge } from "antd";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { projectApi } from "@/api/modules/project";

interface ProjectSwitcherProps {
  onProjectChange?: (projectId: number | null) => void;
}

export function ProjectSwitcher({ onProjectChange }: ProjectSwitcherProps) {
  const { currentProject, projects, setCurrentProject, setProjects } =
    useProjectStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;
    fetchMyProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在挂载时运行，不需要将 fetchMyProjects 加入依赖

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.getMyProjects();
      const projectsWithRole = res.items.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        role: p.role,
        created_at: p.created_at,
      }));
      setProjects(projectsWithRole);
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (projectId: number | null) => {
    if (projectId === null) {
      setCurrentProject(null);
      onProjectChange?.(null);
      return;
    }
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      onProjectChange?.(projectId);
    }
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <Space>
      <Select
        placeholder="选择项目"
        value={currentProject?.id}
        onChange={handleChange}
        allowClear
        loading={loading}
        style={{ minWidth: 200 }}
        data-testid="select-project-switcher"
        options={projects.map((p) => ({
          value: p.id,
          label: (
            <Space>
              <span>{p.name}</span>
              {p.role === "admin" && (
                <Badge count="管理员" style={{ fontSize: 10 }} />
              )}
            </Space>
          ),
        }))}
      />
    </Space>
  );
}
