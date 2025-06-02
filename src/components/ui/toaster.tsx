"use client";

import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");

    setIsDark(checkDark());

    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        /* Custom Toast Animations */
        @keyframes toast-enter {
          0% {
            transform: translate3d(0, -200%, 0) scale(0.6);
            opacity: 0;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }

        @keyframes toast-leave {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, -150%, 0) scale(0.6);
            opacity: 0;
          }
        }

        @keyframes toast-success-bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          40%,
          43% {
            transform: translate3d(0, -8px, 0) scale(1.05);
          }
          70% {
            transform: translate3d(0, -4px, 0) scale(1.02);
          }
          90% {
            transform: translate3d(0, -2px, 0) scale(1.01);
          }
        }

        @keyframes toast-error-shake {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translate3d(-4px, 0, 0);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translate3d(4px, 0, 0);
          }
        }

        @keyframes toast-loading-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(0.98);
            opacity: 0.8;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Apply animations to toast elements */
        .react-hot-toast > div {
          animation: toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)
            forwards;
        }

        .react-hot-toast > div[data-visible="false"] {
          animation: toast-leave 0.4s ease-in forwards;
        }

        .react-hot-toast > div[data-type="success"] {
          animation: toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)
              forwards,
            toast-success-bounce 0.6s ease-in-out 0.2s;
        }

        .react-hot-toast > div[data-type="error"] {
          animation: toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)
              forwards,
            toast-error-shake 0.5s ease-in-out 0.2s;
        }

        .react-hot-toast > div[data-type="loading"] {
          animation: toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)
              forwards,
            toast-loading-pulse 2s ease-in-out infinite 0.3s;
        }

        /* Toast fade in animation */
        .toast-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{
          top: 24,
        }}
        toastOptions={{
          duration: 4000,
          className:
            "rounded-md shadow-xl transition-all select-none toast-fade-in relative overflow-hidden",
          style: {
            background: isDark ? "hsl(var(--card))" : "hsl(var(--card))",
            color: isDark ? "hsl(var(--foreground))" : "hsl(var(--foreground))",
            border: `1px solid ${
              isDark ? "hsl(var(--border))" : "hsl(var(--border))"
            }`,
            padding: "14px 18px",
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "420px",
            minHeight: "48px",
            boxShadow: isDark
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
          success: {
            style: {
              background: isDark ? "#0f2a13" : "#f0fdf4",
              color: isDark ? "#86efac" : "#166534",
              border: `1px solid ${
                isDark ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0"
              }`,
              boxShadow: isDark
                ? "0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -2px rgba(34, 197, 94, 0.1)"
                : "0 10px 15px -3px rgba(34, 197, 94, 0.15), 0 4px 6px -2px rgba(34, 197, 94, 0.05)",
            },
          },
          error: {
            style: {
              background: isDark ? "#2a0f0f" : "#fef2f2",
              color: isDark ? "#fca5a5" : "#991b1b",
              border: `1px solid ${
                isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca"
              }`,
              boxShadow: isDark
                ? "0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)"
                : "0 10px 15px -3px rgba(239, 68, 68, 0.15), 0 4px 6px -2px rgba(239, 68, 68, 0.05)",
            },
          },
          loading: {
            style: {
              background: isDark ? "hsl(var(--card))" : "hsl(var(--card))",
              color: isDark
                ? "hsl(var(--muted-foreground))"
                : "hsl(var(--muted-foreground))",
              border: `1px solid ${
                isDark ? "hsl(var(--border))" : "hsl(var(--border))"
              }`,
              boxShadow: isDark
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)"
                : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
          },
        }}
      />
    </>
  );
}
