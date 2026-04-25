"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        CDP Platform
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Customer Data Platform
      </Typography>
      <Button variant="contained" href="/login" data-testid="btn-go-login">
        Go to Login
      </Button>
    </Box>
  );
}
