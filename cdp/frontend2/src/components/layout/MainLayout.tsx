"use client";

import { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: 64,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ height: 64 }}>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              color: "text.primary",
              fontWeight: 600,
            }}
          >
            CDP - Customer Data Platform
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, pt: "64px" }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
          }}
        >
          <Container maxWidth={false} sx={{ py: 3 }}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
