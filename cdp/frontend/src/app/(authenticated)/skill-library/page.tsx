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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import InputAdornment from "@mui/material/InputAdornment";
import Drawer from "@mui/material/Drawer";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  skillApi,
  Skill,
  SkillLevel,
  SkillCreate,
  SkillUpdate,
} from "@/lib/skillApi";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useConfirmDialog } from "@/components/ConfirmDialog";

const LEVEL_OPTIONS = [
  { value: "Planning", label: "Planning", color: "primary" },
  { value: "Functional", label: "Functional", color: "success" },
  { value: "Atomic", label: "Atomic", color: "warning" },
];

export default function SkillLibraryPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<SkillLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    level: "Atomic" as SkillLevel,
    tags: "",
    author: "",
    content: "",
  });
  const snackbar = useSnackbar();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page: page + 1,
        page_size: rowsPerPage,
      };
      if (keyword) params.keyword = keyword;
      if (levelFilter) params.level = levelFilter;
      if (statusFilter !== "") params.is_active = statusFilter === "true";

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

  const handleAdd = () => {
    setModalMode("create");
    setEditingSkill(null);
    setFormData({
      code: "",
      name: "",
      level: "Atomic",
      tags: "",
      author: "",
      content: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setModalMode("edit");
    setEditingSkill(skill);
    setFormData({
      code: skill.code,
      name: skill.name,
      level: skill.level,
      tags: skill.tags?.join(", ") || "",
      author: skill.author || "",
      content: skill.content,
    });
    setModalOpen(true);
  };

  const handleView = async (skill: Skill) => {
    try {
      const detail = await skillApi.get(skill.code);
      setDetailSkill(detail);
      setDetailOpen(true);
    } catch (e) {
      console.error("Failed to load skill detail:", e);
    }
  };

  const handleModalOk = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      snackbar.warning("请填写必填项");
      return;
    }

    try {
      const tags = formData.tags
        ? formData.tags.split(",").map((t) => t.trim())
        : undefined;
      if (modalMode === "create") {
        const data: SkillCreate = {
          code: formData.code,
          name: formData.name,
          level: formData.level,
          tags,
          author: formData.author || undefined,
          content: formData.content,
        };
        await skillApi.create(data);
        snackbar.success("创建成功");
      } else if (editingSkill) {
        const data: SkillUpdate = {
          name: formData.name,
          level: formData.level,
          tags,
          author: formData.author || undefined,
          content: formData.content,
        };
        await skillApi.update(editingSkill.code, data);
        snackbar.success("更新成功");
      }
      setModalOpen(false);
      loadSkills();
    } catch (e) {
      console.error("Failed to save skill:", e);
      const message = e instanceof Error ? e.message : "操作失败";
      snackbar.error(message || "操作失败");
    }
  };

  const handleToggleStatus = async (skill: Skill) => {
    try {
      if (skill.is_active) {
        await skillApi.deactivate(skill.code);
      } else {
        await skillApi.activate(skill.code);
      }
      loadSkills();
    } catch (e) {
      console.error("Failed to toggle status:", e);
      snackbar.error("操作失败");
    }
  };

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

  const filteredSkills = skills.filter(
    (s) => s.code.includes(keyword) || s.name.includes(keyword),
  );

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
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>状态</InputLabel>
            <Select
              value={statusFilter}
              label="状态"
              onChange={(e) => setStatusFilter(e.target.value as string)}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="true">启用</MenuItem>
              <MenuItem value="false">禁用</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ ml: "auto" }}>
            <Button
              variant="contained"
              onClick={handleAdd}
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
        ) : filteredSkills.length === 0 ? (
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
            <Button variant="text" sx={{ mt: 2 }} onClick={handleAdd}>
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
                    <TableCell>创建时间</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSkills
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
                            label={skill.is_active ? "启用" : "禁用"}
                            color={skill.is_active ? "success" : "default"}
                            size="small"
                            variant={skill.is_active ? "filled" : "outlined"}
                          />
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
                              onClick={() => handleEdit(skill)}
                              title="编辑"
                              data-testid={`btn-edit-${skill.code}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(skill)}
                              title={skill.is_active ? "禁用" : "启用"}
                              data-testid={`btn-toggle-${skill.code}`}
                              color={skill.is_active ? "warning" : "success"}
                            >
                              {skill.is_active ? (
                                <PauseIcon fontSize="small" />
                              ) : (
                                <PlayArrowIcon fontSize="small" />
                              )}
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
              count={filteredSkills.length}
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

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {modalMode === "create" ? "新增技能" : "编辑技能"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="技能代码"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            margin="normal"
            required
            disabled={modalMode === "edit"}
            data-testid="inp-skill-code"
          />
          <TextField
            fullWidth
            label="技能名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            data-testid="inp-skill-name"
          />
          <FormControl fullWidth margin="normal" data-testid="sel-skill-level">
            <InputLabel>级别</InputLabel>
            <Select
              value={formData.level}
              label="级别"
              onChange={(e) =>
                setFormData({
                  ...formData,
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
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            margin="normal"
            data-testid="inp-skill-tags"
          />
          <TextField
            fullWidth
            label="作者"
            value={formData.author}
            onChange={(e) =>
              setFormData({ ...formData, author: e.target.value })
            }
            margin="normal"
            data-testid="inp-skill-author"
          />
          <TextField
            fullWidth
            label="内容"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            data-testid="inp-skill-content"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setModalOpen(false)}
            data-testid="btn-skill-modal-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleModalOk}
            variant="contained"
            data-testid="btn-skill-modal-confirm"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        <Box sx={{ width: 400, p: 3 }}>
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
                  label={detailSkill.is_active ? "启用" : "禁用"}
                  color={detailSkill.is_active ? "success" : "default"}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  内容
                </Typography>
                <Typography variant="body2">
                  {detailSkill.content || "-"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>
      <ConfirmDialog />
    </Box>
  );
}
