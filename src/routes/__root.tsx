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
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/60">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-leaf-900">
          Not here.
        </h1>
        <p className="mt-2 text-sm text-leaf-800/60">
          That page doesn't exist — but everything else is safe and where you
          left it.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-leaf-900 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-sand-50 transition-colors hover:bg-leaf-800"
          >
            Return home
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
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-clay">
          Something interrupted
        </p>
        <h1 className="mt-3 font-display text-3xl italic text-leaf-900">
          Take a breath.
        </h1>
        <p className="mt-2 text-sm text-leaf-800/60">
          Your data is safe on this device. Try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-leaf-900 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-sand-50 transition-colors hover:bg-leaf-800"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-leaf-900/15 bg-transparent px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-leaf-900 transition-colors hover:bg-sand-100"
          >
            Home
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
      { name: "theme-color", content: "#faf8f4" },
      { title: "Tiaki — Set it once. Let Tiaki do the rest." },
      {
        name: "description",
        content:
          "Tiaki is a calm, offline-first personal life dashboard. Care for your documents, vehicles, home, family, pets and more — all in one quiet place.",
      },
      { name: "author", content: "Tiaki" },
      { property: "og:title", content: "Tiaki" },
      {
        property: "og:description",
        content:
          "Set it once. Let Tiaki do the rest. A calm personal life dashboard.",
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
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
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
