"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import {
  projectApi,
  Project,
  ProjectMember,
  OrgProject,
} from "@/lib/projectApi";
import { useSnackbar } from "@/hooks/useSnackbar";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const snackbar = useSnackbar();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Members
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    user_id: "",
    role: "member",
  });

  // Organizations
  const [orgs, setOrgs] = useState<OrgProject[]>([]);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgFormData, setOrgFormData] = useState({ org_id: "" });

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await projectApi.get(Number(id));
      setProject(p);
    } catch {
      snackbar.error("获取项目信息失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!id) return;
    try {
      const res = await projectApi.listMembers(Number(id));
      setMembers(res.items);
    } catch {
      snackbar.error("获取成员列表失败");
    }
  };

  const fetchOrgs = async () => {
    if (!id) return;
    try {
      const res = await projectApi.listOrganizations(Number(id));
      setOrgs(res.items);
    } catch {
      snackbar.error("获取组织关联失败");
    }
  };

  useEffect(() => {
    fetchProject();
    fetchMembers();
    fetchOrgs();
  }, [id]);

  const handleAddMember = async () => {
    if (!memberFormData.user_id.trim()) {
      snackbar.warning("请输入用户ID");
      return;
    }
    try {
      await projectApi.addMember(Number(id), {
        user_id: Number(memberFormData.user_id),
        role: memberFormData.role as "admin" | "member",
      });
      snackbar.success("添加成员成功");
      setMemberModalOpen(false);
      setMemberFormData({ user_id: "", role: "member" });
      fetchMembers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      snackbar.error(err?.response?.data?.detail || "添加成员失败");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("确认移除？")) return;
    try {
      await projectApi.removeMember(Number(id), userId);
      snackbar.success("移除成员成功");
      fetchMembers();
    } catch {
      snackbar.error("移除成员失败");
    }
  };

  const handleUpdateMemberRole = async (userId: number, role: string) => {
    try {
      await projectApi.updateMemberRole(
        Number(id),
        userId,
        role as "admin" | "member",
      );
      snackbar.success("更新角色成功");
      fetchMembers();
    } catch {
      snackbar.error("更新角色失败");
    }
  };

  const handleAddOrg = async () => {
    if (!orgFormData.org_id.trim()) {
      snackbar.warning("请输入组织ID");
      return;
    }
    try {
      await projectApi.associateOrg(Number(id), Number(orgFormData.org_id));
      snackbar.success("关联组织成功");
      setOrgModalOpen(false);
      setOrgFormData({ org_id: "" });
      fetchOrgs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      snackbar.error(err?.response?.data?.detail || "关联组织失败");
    }
  };

  const handleRemoveOrg = async (orgId: number) => {
    if (!confirm("确认取消关联？")) return;
    try {
      await projectApi.disassociateOrg(Number(id), orgId);
      snackbar.success("取消关联成功");
      fetchOrgs();
    } catch {
      snackbar.error("取消关联失败");
    }
  };

  const getRoleColor = (role: string) =>
    role === "admin" ? "primary" : "default";

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => router.push("/projects")}
          sx={{ cursor: "pointer" }}
        >
          项目管理
        </Link>
        <Typography color="text.primary">
          {project?.name || "加载中..."}
        </Typography>
      </Breadcrumbs>

      <Card sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5">{project?.name}</Typography>
          <Chip
            label={project?.status}
            color={project?.status === "active" ? "success" : "warning"}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            代码: {project?.code}
          </Typography>
        </Box>
      </Card>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="成员管理" />
          <Tab label="组织关联" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setMemberModalOpen(true)}
              data-testid="btn-add-member"
            >
              添加成员
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户ID</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>加入时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.user_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.role}
                        color={
                          getRoleColor(member.role) as "primary" | "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Select
                          value={member.role}
                          size="small"
                          onChange={(e) =>
                            handleUpdateMemberRole(
                              member.user_id,
                              e.target.value,
                            )
                          }
                          data-testid={`select-member-role-${member.user_id}`}
                        >
                          <MenuItem value="admin">管理员</MenuItem>
                          <MenuItem value="member">成员</MenuItem>
                        </Select>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveMember(member.user_id)}
                          data-testid={`btn-remove-member-${member.user_id}`}
                        >
                          🗑️
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setOrgModalOpen(true)}
              data-testid="btn-add-org"
            >
              关联组织
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>组织ID</TableCell>
                  <TableCell>组织名称</TableCell>
                  <TableCell>关联时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.org_id}</TableCell>
                    <TableCell>{org.organization?.name || "-"}</TableCell>
                    <TableCell>
                      {new Date(org.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveOrg(org.org_id)}
                        data-testid={`btn-remove-org-${org.org_id}`}
                      >
                        🗑️
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Add Member Dialog */}
      <Dialog
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加成员</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="用户ID"
            type="number"
            value={memberFormData.user_id}
            onChange={(e) =>
              setMemberFormData({ ...memberFormData, user_id: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-member-user-id"
          />
          <Select
            fullWidth
            label="角色"
            value={memberFormData.role}
            onChange={(e) =>
              setMemberFormData({ ...memberFormData, role: e.target.value })
            }
            sx={{ mt: 2 }}
          >
            <MenuItem value="admin">管理员</MenuItem>
            <MenuItem value="member">成员</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMemberModalOpen(false)}
            data-testid="btn-member-modal-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            data-testid="btn-member-modal-confirm"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Org Dialog */}
      <Dialog
        open={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>关联组织</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="组织ID"
            type="number"
            value={orgFormData.org_id}
            onChange={(e) =>
              setOrgFormData({ ...orgFormData, org_id: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-org-id"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrgModalOpen(false)}
            data-testid="btn-org-modal-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleAddOrg}
            variant="contained"
            data-testid="btn-org-modal-confirm"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
