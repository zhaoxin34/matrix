"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import MainLayout from "@/components/layout/MainLayout";
import { CircularProgress } from "@mui/material";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted after first render
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted || isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
}
