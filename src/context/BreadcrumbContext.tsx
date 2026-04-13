"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

export interface Crumb {
  label: string;
  href?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  myjobs: "My Jobs",
  automations: "Automations",
  tasks: "Tasks",
  activities: "Activities",
  questions: "Question Bank",
  profile: "Profile",
  resume: "Resumes",
  admin: "Administration",
  developer: "Developer Options",
  settings: "Settings",
};

function isId(segment: string) {
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
}

const BreadcrumbContext = createContext<{
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[] | null) => void;
}>({ crumbs: [], setCrumbs: () => {} });

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [override, setOverride] = useState<Crumb[] | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    setOverride(null);
  }, [pathname]);

  const autoCrumbs = useMemo<Crumb[] | null>(() => {
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (isId(last)) return null;
    return [{ label: SEGMENT_LABELS[last] ?? last }];
  }, [pathname]);

  const crumbs = override ?? autoCrumbs ?? [];

  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs: setOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  return useContext(BreadcrumbContext);
}

export function BreadcrumbsSetter({ crumbs }: { crumbs: Crumb[] }) {
  const { setCrumbs } = useBreadcrumbs();

  useLayoutEffect(() => {
    setCrumbs(crumbs);
    return () => setCrumbs(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
