import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

/**
 * Phase 3 §13.4 — local font fallback.
 *
 * The original `next/font/google` import (`Geist`, `JetBrains Mono`) fetches
 * font files from fonts.googleapis.com at build time. In restricted networks
 * (China, behind a proxy that can't reach Google) this fails the build.
 *
 * Solution: use a CSS variable that points at a system stack with the same
 * shape as Geist (sans-serif) + JetBrains Mono. Visual fidelity drops a
 * notch but build is reproducible. If/when the build env can reach
 * fonts.gstatic.com again, swap back to `next/font/google`.
 */
const FONT_SANS_STACK =
  '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FONT_MONO_STACK =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          "--font-sans": FONT_SANS_STACK,
          "--font-mono": FONT_MONO_STACK,
        } as React.CSSProperties
      }
      className={cn("antialiased", "font-mono")}
    >
      <body className="h-screen overflow-hidden">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
