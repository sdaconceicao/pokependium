import { relatedProjects } from "@vercel/related-projects";
import type { NextConfig } from "next";

// All work merges to `development` before promoting to `main`, so a
// backend that is missing for the current branch (or not yet promoted to
// production) falls back to its development-branch deployment.
const FALLBACK_BRANCH = "development";

const projects = relatedProjects({ noThrow: true });

// The team scope suffix of *.vercel.app branch aliases, recovered from
// this deployment's own branch URL (<project>-git-<branch>-<scope>).
function teamScope(): string | undefined {
  const branchUrl = process.env.VERCEL_BRANCH_URL;
  const ref = process.env.VERCEL_GIT_COMMIT_REF;
  if (!branchUrl || !ref) return undefined;
  const marker = `-git-${ref.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-`;
  const idx = branchUrl.indexOf(marker);
  if (idx === -1) return undefined;
  return branchUrl.slice(idx + marker.length).replace(/\.vercel\.app$/, "");
}

// An alias can exist while its deployment doesn't: Vercel skips building
// projects whose files didn't change on a branch (placeholder page), and
// branch/production aliases 404 until their first deployment. Probe
// before committing to a candidate.
async function isLive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const contentType = res.headers.get("content-type") ?? "";
    return res.ok && !contentType.includes("text/html");
  } catch {
    return false;
  }
}

// Resolve a backend's origin for the current deployment, first live
// candidate wins: current branch deployment (previews only), then the
// fallback branch, then production, then the env var / localhost default.
async function originFor(
  projectName: string,
  probePath: string,
  defaultHost: string,
): Promise<string> {
  const project = projects.find((p) => p.project.name === projectName);
  const vercelEnv = process.env.VERCEL_ENV;
  const scope = teamScope();
  const candidates: { label: string; origin: string }[] = [];

  const push = (label: string, host: string | undefined) => {
    if (!host) return;
    const origin = `https://${host}`;
    if (!candidates.some((c) => c.origin === origin)) candidates.push({ label, origin });
  };

  if (project && vercelEnv === "preview") {
    push("branch", project.preview.customEnvironment ?? project.preview.branch);
  }
  if (project && (vercelEnv === "preview" || vercelEnv === "production")) {
    if (scope)
      push(FALLBACK_BRANCH, `${project.project.name}-git-${FALLBACK_BRANCH}-${scope}.vercel.app`);
    push("production", project.production.alias ?? project.production.url);
  }

  for (const { label, origin } of candidates) {
    if (await isLive(`${origin}${probePath}`)) {
      console.log(`[related-projects] ${projectName}: using ${origin} (${label})`);
      return origin;
    }
    console.log(
      `[related-projects] ${projectName}: ${origin} (${label}) is not live, falling back`,
    );
  }

  console.log(`[related-projects] ${projectName}: using ${defaultHost} (default)`);
  return defaultHost;
}

export default async function nextConfig(): Promise<NextConfig> {
  const graphqlOrigin = await originFor(
    "pokedex-graphql",
    "/graphql?query=%7B__typename%7D",
    process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace(/\/graphql$/, "") ?? "http://localhost:4000",
  );

  const authOrigin = await originFor(
    "pokedex-auth",
    "/health",
    process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3004",
  );

  const restOrigin = await originFor(
    "pokedex-rest",
    "/health",
    process.env.NEXT_PUBLIC_REST_API_URL ?? "http://localhost:3007",
  );

  return {
    env: {
      NEXT_PUBLIC_GRAPHQL_URL: `${graphqlOrigin}/graphql`,
      NEXT_PUBLIC_AUTH_API_URL: authOrigin,
      NEXT_PUBLIC_REST_API_URL: restOrigin,
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "raw.githubusercontent.com",
        },
        {
          protocol: "https",
          hostname: "dummyimage.com",
        },
      ],
    },
  };
}
