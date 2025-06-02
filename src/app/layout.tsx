import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import Script from "next/script";
import { ThemeProvider } from "@/contexts/theme-provider";
import ClientToaster from "@/components/ui/toaster";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Azyqs Auth Template",
    template: "%s - Azyqs Auth Template",
  },
  description:
    "Azyqs Auth Template. This is a template for authentication using Next.js. Made possible by Azyqs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://www.google.com/recaptcha/api.js" async defer />
        <Script
          id="theme-color-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem("theme");
                  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const isDark = theme === "dark" || (theme === "system" && systemDark);
                  const meta = document.createElement("meta");
                  meta.name = "theme-color";
                  meta.content = isDark ? "#0a0a0a" : "#ffffff";
                  document.head.appendChild(meta);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <ClientToaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
