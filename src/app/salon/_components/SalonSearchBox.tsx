"use client";

import React from "react";
import { Search, X } from "lucide-react";
import type { SalonTable, Zone } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { SearchResultButton } from "./SearchResultButton";
import { useSalonSearch } from "../_hooks/useSalonSearch";

interface SalonSearchBoxProps {
  tables: SalonTable[];
  zones: Zone[];
  reservations: ReservationDTO[];
  onPickResult: (tableId: string, zoneId: string) => void;
}

export function SalonSearchBox({
  tables,
  zones,
  reservations,
  onPickResult,
}: SalonSearchBoxProps) {
  const {
    query,
    setQuery,
    open,
    setOpen,
    highlight,
    setHighlight,
    results,
    inputRef,
    boxRef,
    pick,
  } = useSalonSearch({ tables, zones, reservations, onPickResult });

  const showDropdown = open && query.trim().length > 0;
  const mesas = results.filter((r) => r.kind === "mesa");
  const clientes = results.filter((r) => r.kind === "cliente");

  return (
    <div ref={boxRef} className="relative w-[320px]">
      <div
        className="flex items-center gap-2.5 rounded-[10px] border bg-[#F7F3EE] px-4 py-2.5 transition-colors"
        style={{ borderColor: showDropdown ? "#E67E22" : "#EDE6DC" }}
      >
        <Search className="size-4 shrink-0 text-[#6B6660]" strokeWidth={1.8} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (query) setQuery("");
              else inputRef.current?.blur();
              setOpen(false);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(results[highlight]);
            }
          }}
          placeholder="Buscar mesa o cliente"
          className="flex-1 bg-transparent text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#6B6660]"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              inputRef.current?.focus();
            }}
            className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[#6B6660] hover:bg-[#EDE6DC]"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        ) : (
          <span className="shrink-0 rounded border border-[#EDE6DC] bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#6B4F3A]">
            /
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[380px] overflow-hidden rounded-xl border border-[#EDE6DC] bg-white shadow-[0_12px_32px_rgba(31,27,22,0.14)]">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-5 py-7 text-center">
              <Search className="size-5 text-[#a89d8e]" strokeWidth={1.6} />
              <span className="text-[13px] font-medium text-[#1F1F1F]">
                Sin coincidencias
              </span>
              <span className="text-[11.5px] text-[#6B6660]">
                No encontramos mesas ni clientes para “{query.trim()}”.
              </span>
            </div>
          ) : (
            <div className="flex max-h-[420px] flex-col overflow-y-auto py-1.5">
              {mesas.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 pb-1 pt-2">
                  <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
                    MESAS
                  </span>
                  <span className="font-mono text-[9.5px] text-[#a89d8e]">
                    {mesas.length}
                  </span>
                </div>
              )}
              {mesas.map((r) => (
                <SearchResultButton
                  key={`mesa:${r.tableId}`}
                  result={r}
                  active={results[highlight] === r}
                  onPick={() => pick(r)}
                  onHover={() => setHighlight(results.indexOf(r))}
                />
              ))}
              {clientes.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 pb-1 pt-2">
                  <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
                    CLIENTES
                  </span>
                  <span className="font-mono text-[9.5px] text-[#a89d8e]">
                    {clientes.length}
                  </span>
                </div>
              )}
              {clientes.map((r) => (
                <SearchResultButton
                  key={`${r.secondary}:${r.tableId}`}
                  result={r}
                  active={results[highlight] === r}
                  onPick={() => pick(r)}
                  onHover={() => setHighlight(results.indexOf(r))}
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-2">
            <span className="font-mono text-[9.5px] tracking-[0.1em] text-[#6B6660]">
              ↑↓ NAVEGAR · ↵ ABRIR · ESC CERRAR
            </span>
            <span className="text-[10px] text-[#a89d8e]">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
