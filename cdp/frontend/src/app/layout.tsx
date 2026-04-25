import type { Metadata } from "next";
import { ReactNode } from "react";
import ThemeRegistry from "@/components/ThemeRegistry";
import EmotionRegistry from "@/lib/EmotionRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: "CDP - Customer Data Platform",
  description: "Customer Data Platform for managing customer data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EmotionRegistry>
          <ThemeRegistry>{children}</ThemeRegistry>
        </EmotionRegistry>
      </body>
    </html>
  );
}
