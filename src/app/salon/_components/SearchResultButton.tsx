"use client";

import React from "react";
import { LayoutGrid, SquareUser } from "lucide-react";
import type { SearchResult } from "../_lib/search-types";
import { STATUS_COLOR, STATUS_LABEL } from "../_lib/types";

interface SearchResultButtonProps {
  result: SearchResult;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
}

export function SearchResultButton({
  result,
  active,
  onPick,
  onHover,
}: SearchResultButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onPick();
      }}
      onMouseEnter={onHover}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
      style={{ background: active ? "#F7F3EE" : "transparent" }}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: active ? "#FBE7D6" : "#F7F3EE" }}
      >
        {result.kind === "mesa" ? (
          <LayoutGrid className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
        ) : (
          <SquareUser className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-[#1F1F1F]">
          {result.primary}
        </span>
        <span className="truncate text-[11px] text-[#6B6660]">
          {result.secondary}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className="size-2 rounded-full"
          style={{ background: STATUS_COLOR[result.status] }}
        />
        <span className="text-[10px] font-medium text-[#6B6660]">
          {STATUS_LABEL[result.status]}
        </span>
      </span>
    </button>
  );
}
