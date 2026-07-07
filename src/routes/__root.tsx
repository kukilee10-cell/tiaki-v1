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
    <div className="flex min-h-screen items-center justify-center bg-vault px-6 text-white">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] tracking-[0.22em] text-blue">404</p>
        <h1 className="mt-3 font-display text-[32px] tracking-tight text-white">
          Not here.
        </h1>
        <p className="mt-2 text-[14px] text-white/55">
          That page doesn't exist — but everything else is safe and where you
          left it.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground"
            style={{
              background: "linear-gradient(180deg, #a8c5ff, #5a8dff)",
              boxShadow: "0 8px 24px -8px rgba(126,169,255,0.55)",
            }}
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
    <div className="flex min-h-screen items-center justify-center bg-vault px-6 text-white">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--clay)]">
          SOMETHING INTERRUPTED
        </p>
        <h1 className="mt-3 font-display text-[28px] tracking-tight text-white">
          Take a breath.
        </h1>
        <p className="mt-2 text-[14px] text-white/55">
          Your data is safe on this device. Try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground"
            style={{
              background: "linear-gradient(180deg, #a8c5ff, #5a8dff)",
              boxShadow: "0 8px 24px -8px rgba(126,169,255,0.55)",
            }}
          >
            TRY AGAIN
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-white/80 transition-colors hover:bg-white/5"
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
      { name: "theme-color", content: "#09090b" },
      { title: "Tiaki — Your Life Vault" },
      {
        name: "description",
        content:
          "Tiaki quietly protects the important parts of your life. A calm, offline-first Life Vault for documents, vehicles, home, family and more.",
      },
      { name: "author", content: "Tiaki" },
      { property: "og:title", content: "Tiaki — Your Life Vault" },
      {
        property: "og:description",
        content:
          "Set it once. Let Tiaki do the rest. A calm, premium Life Vault that quietly protects the important parts of your life.",
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
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
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
