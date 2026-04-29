"use client";

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Drawer from "@mui/material/Drawer";
import CircularProgress from "@mui/material/CircularProgress";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Divider from "@mui/material/Divider";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import NoteIcon from "@mui/icons-material/Note";
import PublishIcon from "@mui/icons-material/Publish";
import HistoryIcon from "@mui/icons-material/History";
import BlockIcon from "@mui/icons-material/Block";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import {
  skillApi,
  Skill,
  SkillLevel,
  SkillStatus,
  SkillCreate,
  SkillUpdate,
} from "@/lib/skillApi";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { PublishDialog } from "./components/PublishDialog";
import { HistoryDialog } from "./components/HistoryDialog";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const LEVEL_OPTIONS = [
  { value: "Planning", label: "Planning", color: "primary" },
  { value: "Functional", label: "Functional", color: "success" },
  { value: "Atomic", label: "Atomic", color: "warning" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "草稿", color: "default" },
  { value: "active", label: "启用", color: "success" },
  { value: "disabled", label: "禁用", color: "warning" },
];

export default function SkillLibraryPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<SkillLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<SkillStatus | "">("");
  const [loading, setLoading] = useState(false);

  // Create wizard state
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [basicFormData, setBasicFormData] = useState({
    code: "",
    name: "",
    level: "Atomic" as SkillLevel,
    tags: "",
    author: "",
  });
  const [contentData, setContentData] = useState("");

  // Edit basic info dialog
  const [editBasicOpen, setEditBasicOpen] = useState(false);
  const [editBasicSkill, setEditBasicSkill] = useState<Skill | null>(null);
  const [editBasicForm, setEditBasicForm] = useState({
    name: "",
    level: "Atomic" as SkillLevel,
    tags: "",
    author: "",
  });

  // Edit content dialog
  const [editContentOpen, setEditContentOpen] = useState(false);
  const [editContentSkill, setEditContentSkill] = useState<Skill | null>(null);
  const [editContent, setEditContent] = useState("");

  // View drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);

  // Publish dialog
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishSkill, setPublishSkill] = useState<Skill | null>(null);

  // History dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySkill, setHistorySkill] = useState<Skill | null>(null);

  const snackbar = useSnackbar();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        page_size: rowsPerPage,
      };
      if (keyword) params.keyword = keyword;
      if (levelFilter) params.level = levelFilter;
      if (statusFilter) params.status = statusFilter;

      const result = await skillApi.list(params);
      setSkills(result.items || []);
    } catch (e) {
      console.error("Failed to load skills:", e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, keyword, levelFilter, statusFilter]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // Create handlers
  const handleCreateOpen = () => {
    setBasicFormData({
      code: "",
      name: "",
      level: "Atomic",
      tags: "",
      author: "",
    });
    setContentData("");
    setCreateStep(0);
    // Generate a default skill code
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 6);
    setBasicFormData({
      code: `skill-${timestamp}-${randomPart}`,
      name: "",
      level: "Atomic",
      tags: "",
      author: "",
    });
    setCreateOpen(true);
  };

  const handleCreateStep0Next = async () => {
    if (!basicFormData.code.trim() || !basicFormData.name.trim()) {
      snackbar.warning("请填写必填项");
      return;
    }
    try {
      const tags = basicFormData.tags
        ? basicFormData.tags.split(",").map((t) => t.trim())
        : undefined;
      const data: SkillCreate = {
        code: basicFormData.code,
        name: basicFormData.name,
        level: basicFormData.level,
        tags,
        author: basicFormData.author || undefined,
        content: "",
      };
      await skillApi.create(data);
      setCreateStep(1);
    } catch (e) {
      console.error("Failed to create skill:", e);
      snackbar.error("创建失败");
    }
  };

  const handleCreateStep1Save = async () => {
    if (!basicFormData.code) return;
    try {
      const data: SkillUpdate = { content: contentData };
      await skillApi.update(basicFormData.code, data);
      snackbar.success("保存草稿成功");
      setCreateOpen(false);
      loadSkills();
    } catch (e) {
      console.error("Failed to save content:", e);
      snackbar.error("保存失败");
    }
  };

  // Edit basic info handlers
  const handleEditBasicOpen = (skill: Skill) => {
    setEditBasicSkill(skill);
    setEditBasicForm({
      name: skill.name,
      level: skill.level,
      tags: skill.tags?.join(", ") || "",
      author: skill.author || "",
    });
    setEditBasicOpen(true);
  };

  const handleEditBasicSave = async () => {
    if (!editBasicSkill) return;
    try {
      const tags = editBasicForm.tags
        ? editBasicForm.tags.split(",").map((t) => t.trim())
        : undefined;
      const data: SkillUpdate = {
        name: editBasicForm.name,
        level: editBasicForm.level,
        tags,
        author: editBasicForm.author || undefined,
      };
      await skillApi.update(editBasicSkill.code, data);
      snackbar.success("保存成功");
      setEditBasicOpen(false);
      loadSkills();
    } catch (e) {
      console.error("Failed to save:", e);
      snackbar.error("保存失败");
    }
  };

  // Edit content handlers
  const handleEditContentOpen = async (skill: Skill) => {
    try {
      const detail = await skillApi.get(skill.code);
      setEditContentSkill(detail);
      setEditContent(detail.content);
      setEditContentOpen(true);
    } catch (e) {
      console.error("Failed to load skill:", e);
      snackbar.error("加载失败");
    }
  };

  const handleEditContentSave = async () => {
    if (!editContentSkill) return;
    try {
      const data: SkillUpdate = { content: editContent };
      await skillApi.update(editContentSkill.code, data);
      snackbar.success("保存成功");
      setEditContentOpen(false);
      loadSkills();
    } catch (e) {
      console.error("Failed to save:", e);
      snackbar.error("保存失败");
    }
  };

  // View handler
  const handleView = async (skill: Skill) => {
    try {
      const detail = await skillApi.get(skill.code);
      setDetailSkill(detail);
      setDetailOpen(true);
    } catch (e) {
      console.error("Failed to load skill detail:", e);
    }
  };

  // Delete handler
  const handleDelete = async (skill: Skill) => {
    if (!(await confirm("删除技能", "确认删除该技能？"))) return;
    try {
      await skillApi.delete(skill.code);
      snackbar.success("删除成功");
      loadSkills();
    } catch (e) {
      console.error("Failed to delete skill:", e);
      snackbar.error("删除失败");
    }
  };

  // Publish handlers
  const handlePublishOpen = (skill: Skill) => {
    setPublishSkill(skill);
    setPublishOpen(true);
  };

  // History handlers
  const handleHistoryOpen = (skill: Skill) => {
    setHistorySkill(skill);
    setHistoryOpen(true);
  };

  const getStatusColor = (status: SkillStatus) => {
    switch (status) {
      case "draft":
        return "default";
      case "active":
        return "success";
      case "disabled":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: SkillStatus) => {
    switch (status) {
      case "draft":
        return "草稿";
      case "active":
        return "启用";
      case "disabled":
        return "禁用";
      default:
        return status;
    }
  };

  const getLevelColor = (level: SkillLevel) => {
    switch (level) {
      case "Planning":
        return "primary";
      case "Functional":
        return "success";
      case "Atomic":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Card
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <TextField
            placeholder="搜索技能代码/名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            size="small"
            sx={{ width: 240 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl
            size="small"
            sx={{ minWidth: 120 }}
            data-testid="sel-level-filter"
          >
            <InputLabel>级别</InputLabel>
            <Select
              value={levelFilter}
              label="级别"
              onChange={(e) =>
                setLevelFilter(e.target.value as SkillLevel | "")
              }
            >
              <MenuItem value="">全部</MenuItem>
              {LEVEL_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            sx={{ minWidth: 100 }}
            data-testid="sel-status-filter"
          >
            <InputLabel>状态</InputLabel>
            <Select
              value={statusFilter}
              label="状态"
              onChange={(e) =>
                setStatusFilter(e.target.value as SkillStatus | "")
              }
            >
              <MenuItem value="">全部</MenuItem>
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ ml: "auto" }}>
            <Button
              variant="contained"
              onClick={handleCreateOpen}
              startIcon={<AddIcon />}
              data-testid="btn-skill-add"
            >
              新增技能
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : skills.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 8,
              color: "text.secondary",
            }}
          >
            <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography>暂无技能数据</Typography>
            <Button variant="text" sx={{ mt: 2 }} onClick={handleCreateOpen}>
              创建第一个技能
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>技能代码</TableCell>
                    <TableCell>技能名称</TableCell>
                    <TableCell>级别</TableCell>
                    <TableCell>标签</TableCell>
                    <TableCell>作者</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>版本</TableCell>
                    <TableCell>创建时间</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skills
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((skill) => (
                      <TableRow
                        key={skill.id}
                        hover
                        sx={{ "&:hover": { bgcolor: "action.hover" } }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace", fontWeight: 500 }}
                          >
                            {skill.code}
                          </Typography>
                        </TableCell>
                        <TableCell>{skill.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={skill.level}
                            color={
                              getLevelColor(skill.level) as
                                | "primary"
                                | "success"
                                | "warning"
                                | "default"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {skill.tags && skill.tags.length > 0
                            ? skill.tags
                                .slice(0, 3)
                                .map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))
                            : "-"}
                        </TableCell>
                        <TableCell>{skill.author || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(skill.status)}
                            color={
                              getStatusColor(skill.status) as
                                | "default"
                                | "success"
                                | "warning"
                            }
                            size="small"
                            variant={
                              skill.status === "active" ? "filled" : "outlined"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {skill.version ? (
                            <Chip label={skill.version} size="small" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(skill.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleView(skill)}
                              title="查看"
                              data-testid={`btn-view-${skill.code}`}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditBasicOpen(skill)}
                              title="编辑基本信息"
                              data-testid={`btn-edit-basic-${skill.code}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditContentOpen(skill)}
                              title="编辑内容"
                              data-testid={`btn-edit-content-${skill.code}`}
                            >
                              <NoteIcon fontSize="small" />
                            </IconButton>
                            {skill.status === "draft" && (
                              <IconButton
                                size="small"
                                onClick={() => handlePublishOpen(skill)}
                                title="发布"
                                data-testid={`btn-publish-${skill.code}`}
                              >
                                <PublishIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleHistoryOpen(skill)}
                              title="历史"
                              data-testid={`btn-history-${skill.code}`}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                            {skill.status === "active" && (
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  if (
                                    await confirm(
                                      "禁用技能",
                                      "确认禁用该技能？",
                                    )
                                  ) {
                                    await skillApi.deactivate(skill.code);
                                    snackbar.success("已禁用");
                                    loadSkills();
                                  }
                                }}
                                title="禁用"
                                data-testid={`btn-deactivate-${skill.code}`}
                                sx={{
                                  color: "warning.main",
                                  "&:hover": { color: "warning.dark" },
                                }}
                              >
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            )}
                            {skill.status === "disabled" && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    if (
                                      await confirm(
                                        "转为草稿",
                                        "确认将该技能转为草稿状态？",
                                      )
                                    ) {
                                      await skillApi.update(skill.code, {
                                        status: "draft",
                                      });
                                      snackbar.success("已转为草稿");
                                      loadSkills();
                                    }
                                  }}
                                  title="转为草稿"
                                  data-testid={`btn-to-draft-${skill.code}`}
                                  sx={{
                                    color: "info.main",
                                    "&:hover": { color: "info.dark" },
                                  }}
                                >
                                  <UnpublishedIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(skill)}
                                  title="删除"
                                  data-testid={`btn-delete-${skill.code}`}
                                  sx={{
                                    color: "error.main",
                                    "&:hover": { color: "error.dark" },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 20, 50]}
              component="div"
              count={skills.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="每页行数"
            />
          </>
        )}
      </Card>

      {/* Create Wizard Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新增技能</DialogTitle>
        <DialogContent>
          <Stepper activeStep={createStep} sx={{ py: 2 }}>
            <Step>
              <StepLabel>基本信息</StepLabel>
            </Step>
            <Step>
              <StepLabel>内容</StepLabel>
            </Step>
          </Stepper>
          <Divider sx={{ mb: 2 }} />

          {createStep === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="技能代码"
                value={basicFormData.code}
                onChange={(e) =>
                  setBasicFormData({ ...basicFormData, code: e.target.value })
                }
                required
                data-testid="inp-skill-code"
              />
              <TextField
                fullWidth
                label="技能名称"
                value={basicFormData.name}
                onChange={(e) =>
                  setBasicFormData({ ...basicFormData, name: e.target.value })
                }
                required
                data-testid="inp-skill-name"
              />
              <FormControl fullWidth data-testid="sel-skill-level">
                <InputLabel>级别</InputLabel>
                <Select
                  value={basicFormData.level}
                  label="级别"
                  onChange={(e) =>
                    setBasicFormData({
                      ...basicFormData,
                      level: e.target.value as SkillLevel,
                    })
                  }
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="标签（逗号分隔）"
                value={basicFormData.tags}
                onChange={(e) =>
                  setBasicFormData({ ...basicFormData, tags: e.target.value })
                }
                data-testid="inp-skill-tags"
              />
              <TextField
                fullWidth
                label="作者"
                value={basicFormData.author}
                onChange={(e) =>
                  setBasicFormData({ ...basicFormData, author: e.target.value })
                }
                data-testid="inp-skill-author"
              />
            </Box>
          )}

          {createStep === 1 && (
            <Box sx={{ mt: 1 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                技能内容（Markdown 格式）
              </Typography>
              <MDEditor
                value={contentData}
                onChange={(val) => setContentData(val || "")}
                height={300}
                data-color-mode="light"
                data-testid="md-editor-content"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateOpen(false)}
            data-testid="btn-create-cancel"
          >
            取消
          </Button>
          {createStep === 0 && (
            <Button
              onClick={handleCreateStep0Next}
              variant="contained"
              data-testid="btn-create-next"
            >
              下一步
            </Button>
          )}
          {createStep === 1 && (
            <Button
              onClick={handleCreateStep1Save}
              variant="contained"
              data-testid="btn-create-save"
            >
              保存草稿
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Basic Info Dialog */}
      <Dialog
        open={editBasicOpen}
        onClose={() => setEditBasicOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑基本信息</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="技能代码"
            value={editBasicSkill?.code || ""}
            disabled
            sx={{ mt: 1 }}
            data-testid="inp-edit-basic-code"
          />
          <TextField
            fullWidth
            label="技能名称"
            value={editBasicForm.name}
            onChange={(e) =>
              setEditBasicForm({ ...editBasicForm, name: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-edit-basic-name"
          />
          <FormControl
            fullWidth
            margin="normal"
            data-testid="sel-edit-basic-level"
          >
            <InputLabel>级别</InputLabel>
            <Select
              value={editBasicForm.level}
              label="级别"
              onChange={(e) =>
                setEditBasicForm({
                  ...editBasicForm,
                  level: e.target.value as SkillLevel,
                })
              }
            >
              {LEVEL_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="标签（逗号分隔）"
            value={editBasicForm.tags}
            onChange={(e) =>
              setEditBasicForm({ ...editBasicForm, tags: e.target.value })
            }
            margin="normal"
            data-testid="inp-edit-basic-tags"
          />
          <TextField
            fullWidth
            label="作者"
            value={editBasicForm.author}
            onChange={(e) =>
              setEditBasicForm({ ...editBasicForm, author: e.target.value })
            }
            margin="normal"
            data-testid="inp-edit-basic-author"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditBasicOpen(false)}
            data-testid="btn-edit-basic-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleEditBasicSave}
            variant="contained"
            data-testid="btn-edit-basic-confirm"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog
        open={editContentOpen}
        onClose={() => setEditContentOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>编辑内容 - {editContentSkill?.code}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            技能内容（Markdown 格式）
          </Typography>
          <MDEditor
            value={editContent}
            onChange={(val) => setEditContent(val || "")}
            height={400}
            data-color-mode="light"
            data-testid="md-editor-edit-content"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditContentOpen(false)}
            data-testid="btn-edit-content-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleEditContentSave}
            variant="contained"
            data-testid="btn-edit-content-confirm"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishOpen}
        skill={publishSkill}
        onClose={() => setPublishOpen(false)}
        onPublish={async (code, data) => {
          await skillApi.publish(code, data);
        }}
        onSuccess={() => {
          snackbar.success("发布成功");
          setPublishOpen(false);
          loadSkills();
        }}
        onError={(message) => {
          snackbar.error(message || "发布失败");
        }}
      />

      {/* History Dialog */}
      <HistoryDialog
        open={historyOpen}
        skill={historySkill}
        onClose={() => {
          setHistoryOpen(false);
          setHistorySkill(null);
        }}
        onRollback={async (code, version) => {
          const updatedSkill = await skillApi.rollback(code, { version });
          return updatedSkill;
        }}
        onRollbackSuccess={async (updatedSkill: Skill) => {
          setHistorySkill(updatedSkill);
          await loadSkills();
          snackbar.success("回滚成功");
        }}
      />

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        <Box sx={{ width: 500, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            技能详情
          </Typography>
          {detailSkill && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  技能代码
                </Typography>
                <Typography>{detailSkill.code}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  技能名称
                </Typography>
                <Typography>{detailSkill.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  级别
                </Typography>
                <Chip
                  label={detailSkill.level}
                  color={
                    getLevelColor(detailSkill.level) as
                      | "primary"
                      | "success"
                      | "warning"
                      | "default"
                  }
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  标签
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {detailSkill.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  )) || "-"}
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  作者
                </Typography>
                <Typography>{detailSkill.author || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  状态
                </Typography>
                <Chip
                  label={getStatusLabel(detailSkill.status)}
                  color={
                    getStatusColor(detailSkill.status) as
                      | "default"
                      | "success"
                      | "warning"
                  }
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  版本
                </Typography>
                <Typography>
                  {detailSkill.version ? (
                    <Chip label={detailSkill.version} size="small" />
                  ) : (
                    "-"
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  内容
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    maxHeight: 400,
                    overflow: "auto",
                  }}
                >
                  {detailSkill.content ? (
                    <ReactMarkdown>{detailSkill.content}</ReactMarkdown>
                  ) : (
                    <Typography color="text.secondary">-</Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>
      <ConfirmDialog />
    </Box>
  );
}
