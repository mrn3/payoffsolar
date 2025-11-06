"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total?: number; // total items (optional)
  pageSize?: number; // required if total is provided for range text
  onPageChange?: (page: number) => void; // client-handler
  getHrefForPage?: (page: number) => string; // SSR/link-based navigation
  className?: string;
  showFirstLast?: boolean;
  showJumpInput?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  getHrefForPage,
  className,
  showFirstLast = true,
  showJumpInput = true,
}: PaginationProps) {
  const [jumpValue, setJumpValue] = useState<string>(String(currentPage));

  const pages = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (p: number) => {
    const page = Math.max(1, Math.min(totalPages, p));
    if (onPageChange) onPageChange(page);
  };

  const rangeText = useMemo(() => {
    if (!total || !pageSize) return `Page ${currentPage} of ${totalPages}`;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return `Showing ${start} to ${end} of ${total} results`;
  }, [currentPage, pageSize, total, totalPages]);

  const renderButton = (
    label: React.ReactNode,
    targetPage: number,
    disabled: boolean,
    roundedClass?: string
  ) => {
    const classes = `relative inline-flex items-center px-2 py-2 ${
      roundedClass || ""
    } border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`;

    if (getHrefForPage && !onPageChange) {
      return (
        <Link href={getHrefForPage(targetPage)} className={classes} aria-disabled={disabled}>
          {label}
        </Link>
      );
    }
    return (
      <button
        onClick={() => !disabled && goToPage(targetPage)}
        disabled={disabled}
        className={classes}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={`mt-6 flex items-center justify-between ${className || ""}`}>
      {/* Mobile: Previous/Next + optional jump */}
      <div className="flex-1 flex justify-between sm:hidden w-full items-center">
        <div className="flex items-center">
          {renderButton("Previous", currentPage - 1, !canGoPrev, "rounded-md")}
        </div>
        <div className="flex items-center space-x-2">
          {showJumpInput && (
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = parseInt(jumpValue || "");
                  if (!isNaN(v)) goToPage(v);
                }
              }}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
              aria-label="Jump to page"
            />
          )}
        </div>
        <div className="flex items-center">
          {renderButton("Next", currentPage + 1, !canGoNext, "rounded-md")}
        </div>
      </div>

      {/* Desktop: range + full pager + jump */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
        <div>
          <p className="text-sm text-gray-700">{rangeText}</p>
        </div>
        <div className="flex items-center space-x-3">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {showFirstLast && renderButton("First", 1, !canGoPrev, "rounded-l-md")}
            {renderButton("Previous", currentPage - 1, !canGoPrev)}
            {pages.map((p) => {
              const classes = `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                p === currentPage
                  ? "z-10 bg-green-50 border-green-500 text-green-600"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
              }`;
              if (getHrefForPage && !onPageChange) {
                return (
                  <Link key={p} href={getHrefForPage(p)} className={classes}>
                    {p}
                  </Link>
                );
              }
              return (
                <button key={p} onClick={() => goToPage(p)} className={classes}>
                  {p}
                </button>
              );
            })}
            {renderButton("Next", currentPage + 1, !canGoNext)}
            {showFirstLast && renderButton("Last", totalPages, !canGoNext, "rounded-r-md")}
          </nav>
          {showJumpInput && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Go to page:</label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseInt(jumpValue || "");
                    if (!isNaN(v)) goToPage(v);
                  }
                }}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                aria-label="Jump to page"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

