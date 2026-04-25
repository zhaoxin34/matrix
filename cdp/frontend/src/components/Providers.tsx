"use client";

import { ReactNode } from "react";
import { NotificationProvider } from "./NotificationProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
