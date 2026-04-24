"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

interface CustomerItem {
  key: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
}

const mockCustomers: CustomerItem[] = [
  {
    key: "1",
    id: "C001",
    name: "张三",
    phone: "13800138001",
    email: "zhangsan@example.com",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    key: "2",
    id: "C002",
    name: "李四",
    phone: "13800138002",
    email: "lisi@example.com",
    status: "active",
    createdAt: "2024-01-16",
  },
  {
    key: "3",
    id: "C003",
    name: "王五",
    phone: "13800138003",
    email: "wangwu@example.com",
    status: "inactive",
    createdAt: "2024-01-17",
  },
  {
    key: "4",
    id: "C004",
    name: "赵六",
    phone: "13800138004",
    email: "zhaoliu@example.com",
    status: "active",
    createdAt: "2024-01-18",
  },
];

export default function CustomerPage() {
  const [searchText, setSearchText] = useState("");
  const [customers, setCustomers] = useState<CustomerItem[]>(mockCustomers);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSearch = () => {
    if (!searchText.trim()) {
      setCustomers(mockCustomers);
      return;
    }
    const filtered = mockCustomers.filter(
      (c) =>
        c.name.includes(searchText) ||
        c.phone.includes(searchText) ||
        c.email.includes(searchText),
    );
    setCustomers(filtered);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card data-testid="card-customer-list">
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3 }}>
            客户管理
          </Typography>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <TextField
              placeholder="搜索客户姓名、手机号或邮箱"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ width: 300 }}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton size="small">
                        <Typography variant="body2" color="text.secondary">
                          🔍
                        </Typography>
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              data-testid="inp-customer-search"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              data-testid="btn-customer-search"
            >
              搜索
            </Button>
          </Box>

          <TableContainer>
            <Table data-testid="table-customer-list">
              <TableHead>
                <TableRow>
                  <TableCell>客户信息</TableCell>
                  <TableCell>手机号</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => (
                    <TableRow
                      key={customer.key}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => console.log("clicked customer:", customer)}
                      data-testid="row-customer-first"
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar>{customer.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="body2">{customer.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={customer.status === "active" ? "活跃" : "不活跃"}
                          color={customer.status === "active" ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{customer.createdAt}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={customers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
