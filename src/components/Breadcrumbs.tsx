"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";

export function Breadcrumbs() {
  const { crumbs } = useBreadcrumbs();

  if (crumbs.length === 0) return null;

  if (crumbs.length === 1) {
    return <span className="font-semibold text-sm">{crumbs[0].label}</span>;
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {isLast || !crumb.href ? (
                <span className="font-semibold text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
