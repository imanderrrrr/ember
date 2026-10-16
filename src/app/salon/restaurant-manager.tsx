"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { FloorPlan, TableStatus } from "./_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { useRealtimeEvents } from "@/lib/use-realtime-events";
import type { Bill } from "@/app/caja/_lib/billing";
import { useSalonLayout } from "./_hooks/useSalonLayout";
import { SalonTopBar } from "./_components/SalonTopBar";
import { SalonLeftSidebar } from "./_components/SalonLeftSidebar";
import { SalonZoneTabs } from "./_components/SalonZoneTabs";
import { SalonFloorMap } from "./_components/SalonFloorMap";
import { SalonTableListView } from "./_components/SalonTableListView";
import { SalonTableDetailDrawer } from "./_components/SalonTableDetailDrawer";

export { SalonFloorMap as FloorPlanCanvas } from "./_components/SalonFloorMap";

interface SessionUser {
  name: string;
  role: string | null;
  avatarInitials: string | null;
}

export function RestaurantManager({
  plan,
  activeZoneId,
  reservations,
  serviceDate,
  billByTable,
}: {
  plan: FloorPlan;
  activeZoneId: string | null;
  reservations: ReservationDTO[];
  serviceDate: string;
  user: SessionUser | null;
  billByTable: Record<string, Bill>;
}) {
  useRealtimeEvents({
    events: [
      "table:status_updated",
      "order:created",
      "order:status_updated",
      "sale:recorded",
    ],
    refreshOnEvent: true,
  });

  const {
    zoom,
    zoomIn,
    zoomOut,
    selectedTableId,
    setSelectedTableId,
    statusFilter,
    setStatusFilter,
    view,
    setView,
  } = useSalonLayout();

  const activeZone =
    plan.zones.find((z) => z.id === activeZoneId) ?? plan.zones[0] ?? null;

  const rawActiveZoneTables = plan.tables.filter(
    (t) => t.zoneId === activeZone?.id,
  );

  const activeZoneTables =
    statusFilter === "todos"
      ? rawActiveZoneTables
      : rawActiveZoneTables.filter((t) => t.status === statusFilter);

  const activeZoneShapes = plan.shapes.filter(
    (s) => s.zoneId === activeZone?.id || s.zoneId === null,
  );

  const selectedTable =
    plan.tables.find((t) => t.id === selectedTableId) ?? null;
  const zoneNameById = new Map(plan.zones.map((z) => [z.id, z.name]));

  const router = useRouter();
  const [, startSearchNav] = useTransition();

  const handlePickResult = (tableId: string, zoneId: string) => {
    setSelectedTableId(tableId);
    if (zoneId !== activeZone?.id) {
      startSearchNav(() => router.push(`/salon?zone=${zoneId}`));
    }
  };

  const handleSelectZone = (zoneId: string) => {
    startSearchNav(() => router.push(`/salon?zone=${zoneId}`));
  };

  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      <SalonTopBar
        tables={plan.tables}
        zones={plan.zones}
        reservations={reservations}
        onPickResult={handlePickResult}
      />
      <div className="flex min-h-[1028px] flex-1">
        <SalonLeftSidebar
          zones={plan.zones}
          tables={plan.tables}
          activeZoneId={activeZone?.id ?? null}
          activeFilter={statusFilter}
          onSelectFilter={setStatusFilter}
        />
        <main className="animate-salon-main flex flex-1 flex-col bg-[#F7F3EE]">
          <SalonZoneTabs
            zone={activeZone}
            allZones={plan.zones}
            tables={rawActiveZoneTables}
            view={view}
            onChangeView={setView}
            onSelectZone={handleSelectZone}
          />
          <div className="flex flex-1 p-6">
            {view === "plano" ? (
              <SalonFloorMap
                tables={activeZoneTables}
                shapes={activeZoneShapes}
                reservations={reservations}
                zoneNameById={zoneNameById}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
              />
            ) : (
              <SalonTableListView
                tables={activeZoneTables}
                reservations={reservations}
                zoneNameById={zoneNameById}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
              />
            )}
          </div>
        </main>
        <SalonTableDetailDrawer
          table={selectedTable}
          reservations={reservations}
          zoneName={
            selectedTable
              ? zoneNameById.get(selectedTable.zoneId) ?? null
              : null
          }
          serviceDate={serviceDate}
          bill={selectedTable ? billByTable[selectedTable.id] ?? null : null}
          onClose={() => setSelectedTableId(null)}
        />
      </div>
    </div>
  );
}
