import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-950 px-6 text-white">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] tracking-[0.22em] text-hivis">404</p>
        <h1 className="mt-3 font-display text-[32px] tracking-tight text-white">
          404 — NO RECORD
        </h1>
        <p className="mt-2 text-[14px] text-white/55">
          This screen is not on file.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-[3px] bg-hivis px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground"
          >
            RETURN HOME
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-950 px-6 text-white">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--crit)]">
          OPERATION FAILED
        </p>
        <h1 className="mt-3 font-display text-[28px] tracking-tight text-white">
          SYSTEM FAULT
        </h1>
        <p className="mt-2 text-[14px] text-white/55">
          Data is held locally on this device. Retry the operation.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-[3px] bg-hivis px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground"
          >
            TRY AGAIN
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-[3px] border border-steel-700 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-steel-400 transition-colors hover:bg-steel-800"
          >
            HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#0b0c0d" },
      { title: "Rotation Co. — Warehouse & Inventory" },
      {
        name: "description",
        content:
          "Industrial stock control for Rotation Co. — track units on hand, stock value, inbound deliveries, sales and dockets.",
      },
      { name: "author", content: "Rotation Co." },
      { property: "og:title", content: "Rotation Co. — Warehouse & Inventory" },
      {
        property: "og:description",
        content:
          "Warehouse and inventory control terminal for Rotation Co.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
