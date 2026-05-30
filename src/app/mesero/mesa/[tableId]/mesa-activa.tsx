"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Check,
  ChefHat,
  ChevronRight,
  CircleAlert,
  Flame,
  Minus,
  Move,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  CATALOG,
  CATEGORIES,
  IVA_RATE,
  formatQ,
  mockOrderForTable,
  type CartLine,
  type Product,
} from "@/app/salon/_lib/menu";
import { updateTable } from "@/app/salon/_lib/client-api";
import { createKitchenOrder } from "@/app/cocina/_lib/orders";
import { UserMenu } from "@/app/dashboard/user-menu";
import type { SalonTable } from "@/app/salon/_lib/types";

/** Estación de cocina dominante de la comanda (heurística por nombres). */
function stationForItems(names: string[]): string {
  const joined = names.join(" ").toLowerCase();
  if (/(bife|ojo de bife|cordero|costilla|chorizo|provoleta|parrilla)/.test(joined))
    return "parrilla";
  if (/(agua|limonada|vino|malbec|café|cafe|bebida)/.test(joined)) return "bebidas";
  if (/(tiramis|postre|helado)/.test(joined)) return "postres";
  if (/(tartar|burrata|croqueta|ceviche|ensalada)/.test(joined)) return "entradas";
  return "platos";
}

type Waiter = { name: string; avatarInitials: string | null } | null;

const ALL_PRODUCTS: { product: Product; categoryKey: string; categoryLabel: string }[] =
  CATEGORIES.flatMap((c) =>
    (CATALOG[c.key] ?? []).map((product) => ({
      product,
      categoryKey: c.key,
      categoryLabel: c.label,
    })),
  );

export function MesaActiva({
  table,
  zoneName,
  waiter,
  dateLabel,
  timeLabel,
}: {
  table: SalonTable;
  zoneName: string;
  waiter: Waiter;
  dateLabel: string;
  timeLabel: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Si la mesa ya está en servicio, arrancamos con su comanda en curso
  // (misma fuente determinística que el rail del mesero); si está libre, vacía.
  const [cart, setCart] = useState<CartLine[]>(() =>
    mockOrderForTable(table.id, table.status),
  );
  const [activeCat, setActiveCat] = useState<string>("todos");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const totals = useMemo(() => {
    const gross = cart.reduce((a, l) => a + l.unitPrice * l.qty, 0);
    const subtotal = gross / (1 + IVA_RATE);
    const iva = gross - subtotal;
    const tip = gross * 0.1;
    return { gross, subtotal, iva, tip };
  }, [cart]);
  const count = cart.reduce((a, l) => a + l.qty, 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_PRODUCTS.filter(
      (x) =>
        (activeCat === "todos" || x.categoryKey === activeCat) &&
        (q === "" ||
          x.product.name.toLowerCase().includes(q) ||
          x.product.desc.toLowerCase().includes(q)),
    );
  }, [activeCat, query]);

  const selected = ALL_PRODUCTS.find((x) => x.product.id === selectedId) ?? null;
  const activeCatLabel =
    activeCat === "todos"
      ? "Todo el menú"
      : CATEGORIES.find((c) => c.key === activeCat)?.label ?? "Menú";

  const addToCart = (p: Product) =>
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      if (ex)
        return c.map((l) =>
          l.productId === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      return [...c, { productId: p.id, name: p.name, unitPrice: p.price, qty: 1 }];
    });
  const dec = (id: string) =>
    setCart((c) =>
      c.flatMap((l) =>
        l.productId === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l],
      ),
    );
  const removeLine = (id: string) =>
    setCart((c) => c.filter((l) => l.productId !== id));

  const comensales = table.partySize ?? table.seats;
  const waiterName = waiter?.name ?? "Mesero";

  const handleSend = async () => {
    if (cart.length === 0 || sending) return;
    setSending(true);
    try {
      // 1) Persistimos la comanda real → aparece en el KDS de cocina.
      await createKitchenOrder({
        tableId: table.id,
        tableLabel: table.label,
        zoneName,
        partySize: comensales,
        mesero: waiterName,
        station: stationForItems(cart.map((l) => l.name)),
        items: cart.map((l) => ({ qty: l.qty, name: l.name })),
      });
      // 2) La mesa pasa a "cocina".
      await updateTable(table.id, { status: "cocina" });
      startTransition(() => router.push("/mesero"));
    } catch (e) {
      console.error("[mesa-activa] enviar a cocina failed", e);
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      {/* Top bar */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-5">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => router.push("/mesero")}
            className="flex items-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white px-3 py-2 transition-colors hover:bg-[#F7F3EE]"
          >
            <ArrowLeft className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] font-medium">Volver al mapa</span>
          </button>
          <span className="h-7 w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-2.5">
            <span className="flex size-[30px] items-center justify-center rounded-full bg-[#1F1F1F]">
              <Flame className="size-3.5 text-[#E67E22]" strokeWidth={2} />
            </span>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#1F1F1F]">
                  CASA OLIVAR
                </span>
                <span className="text-[12px] text-[#6B6660]">Salón en vivo</span>
              </div>
              <span className="ml-1 rounded-md bg-[#FBE7D6] px-2 py-1 font-mono text-[11px] font-bold text-[#7A2E14]">
                Mesa {table.label}
              </span>
            </div>
          </div>
          <span className="h-7 w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-5">
            <Meta label="FECHA" value={dateLabel} />
            <Meta label="HORA" value={timeLabel} mono />
            <Meta label="TURNO" value="Cena · activo" dot />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex w-[300px] items-center gap-2.5 rounded-[10px] border border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-2.5">
            <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
            <span className="flex-1 text-[12px] text-[#6B6660]">
              Buscar producto, mesa o cliente
            </span>
          </div>
          <button className="flex size-9 items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white">
            <Banknote className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-white py-1.5 pl-2.5 pr-3">
            <ChefHat className="size-3.5 text-[#4E7DA6]" strokeWidth={1.8} />
            <span className="text-[11px] font-medium">Cocina</span>
            <span className="flex size-4 items-center justify-center rounded-full bg-[#4E7DA6] font-mono text-[9px] font-bold text-white">
              3
            </span>
          </div>
          <span className="h-7 w-px bg-[#EDE6DC]" />
          <UserMenu />
        </div>
      </header>

      {/* Body: 4 columns */}
      <div className="flex min-h-0 flex-1">
        <ServiceColumn
          table={table}
          zoneName={zoneName}
          comensales={comensales}
          waiterName={waiterName}
          openTime={timeLabel}
          hasOrder={cart.length > 0}
        />
        <MenuColumn
          table={table}
          count={count}
          query={query}
          onQuery={setQuery}
          activeCat={activeCat}
          onCat={setActiveCat}
          activeCatLabel={activeCatLabel}
          visible={visible}
          cart={cart}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addToCart}
        />
        <PersonalizationColumn selected={selected?.product ?? null} onAdd={addToCart} />
        <ComandaColumn
          table={table}
          cart={cart}
          totals={totals}
          count={count}
          sending={sending}
          onAdd={addToCart}
          onDec={dec}
          onRemove={removeLine}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
  dot,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dot?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        {dot && <span className="size-1.5 rounded-full bg-[#7C8A6A]" />}
        <span
          className={`text-[12px] font-medium ${mono ? "font-mono font-semibold" : ""}`}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

/* ============ COLUMN 1 — SERVICE INFO ============ */

function ServiceColumn({
  table,
  zoneName,
  comensales,
  waiterName,
  openTime,
  hasOrder,
}: {
  table: SalonTable;
  zoneName: string;
  comensales: number;
  waiterName: string;
  openTime: string;
  hasOrder: boolean;
}) {
  const client = table.customerName;
  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[#EDE6DC] bg-white">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#6B4F3A]">
              MESA
            </span>
            <span className="font-mono text-[44px] font-bold leading-none">
              {table.label}
            </span>
          </div>
          <button className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC] text-[#6B4F3A] hover:bg-[#F7F3EE]">
            <span className="text-[16px] leading-none">⋯</span>
          </button>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full bg-[#FBE7D6] py-1.5 pl-2.5 pr-3">
          <span className="size-1.5 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.04em] text-[#7A2E14]">
            Abierta · {openTime} · {hasOrder ? "Con pedido" : "Sin pedido"}
          </span>
        </div>
      </div>

      <Section title="DATOS DEL SERVICIO">
        <Row label="Comensales" value={`${comensales} personas`} />
        <Row label="Mesero asignado" value={waiterName} />
        <Row label="Hora apertura" value={openTime} mono />
        <Row label="Sección" value={zoneName} />
      </Section>

      <Section title="CLIENTE PRINCIPAL">
        {client ? (
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#FBE7D6] font-mono text-[11px] font-bold text-[#7A2E14]">
              {client
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold">{client}</span>
                <span className="rounded bg-[#1F1F1F] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#FAF5EB]">
                  VIP
                </span>
              </div>
              <span className="text-[11px] text-[#6B6660]">
                Cliente recurrente · 12 visitas
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[12px] text-[#6B6660]">
            Sin cliente asignado a esta mesa.
          </span>
        )}
      </Section>

      <Section title="PREFERENCIAS">
        <div className="flex flex-wrap gap-2">
          {["Sin lactosa", "Mesa silenciosa", "Vino tinto reserva"].map((p) => (
            <span
              key={p}
              className="rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1 text-[11px] text-[#6B4F3A]"
            >
              {p}
            </span>
          ))}
        </div>
      </Section>

      <div className="flex flex-col gap-3 p-6">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ACCIONES RÁPIDAS
        </span>
        <QuickAction icon={<Move className="size-3.5" strokeWidth={1.8} />} label="Mover mesa" />
        <QuickAction icon={<Receipt className="size-3.5" strokeWidth={1.8} />} label="Dividir cuenta" />
        <SolicitarCuentaBtn tableId={table.id} hasOrder={hasOrder} />
      </div>
    </aside>
  );
}

function SolicitarCuentaBtn({ tableId, hasOrder }: { tableId: string; hasOrder: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSolicitar = () => {
    if (!hasOrder) return;
    startTransition(async () => {
      try {
        await updateTable(tableId, { status: "esperando" });
        // El mesero no cobra — solo solicita. Vuelve a su salón para
        // atender otras mesas; el gerente/cajero procesa el cobro en /caja.
        router.push("/mesero");
      } catch (e) {
        console.error("[mesa-activa] solicitar cuenta failed", e);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSolicitar}
      disabled={!hasOrder || pending}
      className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#E67E22] transition-colors hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Banknote className="size-3.5 text-white" strokeWidth={1.8} />
      <span className="text-[13px] font-semibold text-white">
        {pending ? "Avisando al cajero…" : "Solicitar cuenta"}
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#EDE6DC] px-6 py-5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
        {title}
      </span>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6B6660]">{label}</span>
      <span className={`text-[12px] font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex h-11 items-center gap-2.5 rounded-[10px] border border-[#EDE6DC] bg-white px-4 transition-colors hover:bg-[#F7F3EE]">
      <span className="text-[#6B4F3A]">{icon}</span>
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}

/* ============ COLUMN 2 — MENU ============ */

function MenuColumn({
  table,
  count,
  query,
  onQuery,
  activeCat,
  onCat,
  activeCatLabel,
  visible,
  cart,
  selectedId,
  onSelect,
  onAdd,
}: {
  table: SalonTable;
  count: number;
  query: string;
  onQuery: (q: string) => void;
  activeCat: string;
  onCat: (k: string) => void;
  activeCatLabel: string;
  visible: { product: Product; categoryLabel: string }[];
  cart: CartLine[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (p: Product) => void;
}) {
  const tabs = [{ key: "todos", label: "Todos" }, ...CATEGORIES.map((c) => ({ key: c.key, label: c.label }))];
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F3EE]">
      <div className="flex flex-col gap-4 px-7 pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] font-semibold">Comienza el pedido</h1>
            <span className="text-[12px] text-[#6B6660]">
              Selecciona del menú · Mesa {table.label} ·{" "}
              {count > 0 ? `${count} en comanda` : "Comanda vacía"}
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#FBE7D6] px-3 py-1.5">
            <span className="font-mono text-[11px] font-bold text-[#7A2E14]">
              {count} en comanda
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 rounded-[10px] border border-[#EDE6DC] bg-white px-3.5 py-2.5">
            <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscar producto del menú… (ej. tartar, risotto, vino tinto)"
              className="flex-1 bg-transparent text-[12.5px] text-[#1F1F1F] outline-none placeholder:text-[#a89d8e]"
            />
          </div>
          <button className="flex items-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white px-3.5 py-2.5">
            <SlidersHorizontal className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] font-medium">Filtros</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.key === activeCat;
            return (
              <button
                key={t.key}
                onClick={() => onCat(t.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-[#1F1F1F] text-[#FAF5EB]"
                    : "border border-[#EDE6DC] bg-white text-[#6B4F3A] hover:bg-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-7 pb-3">
        <span className="text-[13px] font-semibold">
          {activeCatLabel}{" "}
          <span className="font-normal text-[#6B6660]">
            · {visible.length} productos disponibles
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-7 pb-7">
        {visible.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-[13px] text-[#6B6660]">
            Sin productos para “{query}”.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map(({ product, categoryLabel }, i) => {
              const inCart = cart.find((l) => l.productId === product.id);
              const isSelected = selectedId === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelect(product.id)}
                  className="flex flex-col gap-3 rounded-xl border bg-white p-3.5 text-left transition-shadow hover:shadow-[0_4px_12px_rgba(31,31,31,0.06)]"
                  style={{
                    borderColor: isSelected ? "#E67E22" : "#EDE6DC",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F7F3EE]">
                      <Sparkles className="size-4 text-[#C2410C]" strokeWidth={1.6} />
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold">
                          {product.name}
                        </span>
                        <span className="font-mono text-[12px] font-semibold">
                          {formatQ(product.price)}
                        </span>
                      </div>
                      {inCart && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#E67E22]">
                          <Check className="size-3" strokeWidth={2.4} /> En comanda ·{" "}
                          {inCart.qty}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="line-clamp-2 text-[11.5px] leading-[1.4] text-[#6B6660]">
                    {product.desc}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#F7F3EE] px-2 py-0.5 font-mono text-[9px] font-medium text-[#6B4F3A]">
                        {categoryLabel}
                      </span>
                      {i % 4 === 0 && (
                        <span className="rounded bg-[#FBE7D6] px-2 py-0.5 font-mono text-[9px] font-medium text-[#C2410C]">
                          Top
                        </span>
                      )}
                    </div>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(product);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#1F1F1F] px-3 py-1.5 text-white transition-colors hover:bg-[#000]"
                    >
                      <Plus className="size-3" strokeWidth={2.4} />
                      <span className="text-[11px] font-semibold">Agregar</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

/* ============ COLUMN 3 — PERSONALIZATION ============ */

function PersonalizationColumn({
  selected,
  onAdd,
}: {
  selected: Product | null;
  onAdd: (p: Product) => void;
}) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-[#EDE6DC] bg-white">
      <div className="flex flex-col gap-1 border-b border-[#EDE6DC] px-5 py-4">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          PERSONALIZACIÓN
        </span>
        <span className="text-[12px] text-[#6B6660]">
          {selected ? selected.name : "Esperando selección"}
        </span>
      </div>

      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#F7F3EE]">
            <CircleAlert className="size-5 text-[#a89d8e]" strokeWidth={1.6} />
          </span>
          <span className="text-[14px] font-semibold">Selecciona un producto</span>
          <p className="max-w-[220px] text-[11.5px] leading-[1.5] text-[#6B6660]">
            Cuando elijas un platillo del catálogo verás aquí niveles de cocción,
            acompañamientos, extras y notas.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          <p className="text-[11.5px] leading-[1.4] text-[#6B6660]">
            {selected.desc}
          </p>
          {["Nivel de cocción", "Acompañamiento", "Extras y adiciones"].map((s) => (
            <div
              key={s}
              className="flex items-center justify-between rounded-[10px] border border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-3"
            >
              <span className="text-[12px] font-medium">{s}</span>
              <ChevronRight className="size-4 text-[#a89d8e]" strokeWidth={1.8} />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5 border-t border-[#EDE6DC] p-5">
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onAdd(selected)}
          className="flex h-11 items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold transition-colors disabled:cursor-not-allowed"
          style={{
            background: selected ? "#1F1F1F" : "#EDE6DC",
            color: selected ? "#FFFFFF" : "#a89d8e",
          }}
        >
          <Plus className="size-3.5" strokeWidth={2.2} />
          Agregar a la comanda
        </button>
        <span className="text-center text-[10px] text-[#a89d8e]">
          {selected ? "Listo para agregar" : "Disponible si eliges un producto"}
        </span>
      </div>
    </aside>
  );
}

/* ============ COLUMN 4 — COMANDA ACTIVA ============ */

const STEPS = ["Tomada", "En cocina", "Lista", "Servida"];

function ComandaColumn({
  table,
  cart,
  totals,
  count,
  sending,
  onAdd,
  onDec,
  onRemove,
  onSend,
}: {
  table: SalonTable;
  cart: CartLine[];
  totals: { gross: number; subtotal: number; iva: number; tip: number };
  count: number;
  sending: boolean;
  onAdd: (p: Product) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onSend: () => void;
}) {
  const empty = cart.length === 0;
  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-[#EDE6DC] bg-white">
      <div className="flex items-center justify-between border-b border-[#EDE6DC] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold">Comanda activa</span>
          <span className="font-mono text-[10px] text-[#6B6660]">
            #A-1428 · Mesa {table.label}
          </span>
        </div>
        <button className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC] text-[#6B4F3A] hover:bg-[#F7F3EE]">
          <Pencil className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 border-b border-[#EDE6DC] px-5 py-3.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className="h-1 w-full rounded-full"
              style={{ background: i === 0 && !empty ? "#E67E22" : "#EDE6DC" }}
            />
            <span
              className="font-mono text-[9px] font-semibold tracking-[0.04em]"
              style={{ color: i === 0 && !empty ? "#C2410C" : "#a89d8e" }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-7 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F7F3EE]">
              <Receipt className="size-6 text-[#a89d8e]" strokeWidth={1.5} />
            </span>
            <span className="text-[15px] font-semibold">
              La comanda está lista para comenzar
            </span>
            <p className="max-w-[260px] text-[12px] leading-[1.5] text-[#6B6660]">
              Agrega productos desde el menú para enviarlos a cocina y empezar el
              servicio.
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
              {["Del chef", "Populares", "Combos del día"].map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-white px-3 py-1.5 text-[11px] text-[#6B4F3A]"
                >
                  <Star className="size-3 text-[#E67E22]" strokeWidth={1.8} />
                  {c}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 p-5">
            {cart.map((l) => (
              <div
                key={l.productId}
                className="flex items-center gap-3 rounded-xl border border-[#EDE6DC] bg-white p-3"
              >
                <div className="flex items-center gap-1.5 rounded-lg bg-[#F7F3EE] p-1">
                  <button
                    onClick={() => onDec(l.productId)}
                    className="flex size-6 items-center justify-center rounded-md hover:bg-white"
                  >
                    <Minus className="size-3 text-[#6B4F3A]" strokeWidth={2.2} />
                  </button>
                  <span className="w-5 text-center font-mono text-[12px] font-bold">
                    {l.qty}
                  </span>
                  <button
                    onClick={() =>
                      onAdd({ id: l.productId, name: l.name, desc: "", price: l.unitPrice })
                    }
                    className="flex size-6 items-center justify-center rounded-md hover:bg-white"
                  >
                    <Plus className="size-3 text-[#6B4F3A]" strokeWidth={2.2} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[12.5px] font-semibold">{l.name}</span>
                  <span className="font-mono text-[10px] text-[#6B6660]">
                    {formatQ(l.unitPrice)} c/u
                  </span>
                </div>
                <span className="font-mono text-[12px] font-semibold">
                  {formatQ(l.unitPrice * l.qty)}
                </span>
                <button
                  onClick={() => onRemove(l.productId)}
                  className="flex size-6 items-center justify-center rounded-md text-[#a89d8e] hover:bg-[#F7F3EE]"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="flex flex-col gap-1.5 border-t border-[#EDE6DC] px-5 pb-4 pt-5">
        <TotalRow label="Subtotal" value={formatQ(totals.subtotal)} />
        <TotalRow label="Descuento" value={`−${formatQ(0)}`} />
        <TotalRow label="Propina sugerida (10%)" value={formatQ(totals.tip)} />
        <TotalRow label="IVA (12%)" value={formatQ(totals.iva)} />
        <div className="my-1 h-px bg-[#EDE6DC]" />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-[0.1em]">
            TOTAL
          </span>
          <span className="font-mono text-[20px] font-bold">
            {formatQ(totals.gross)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-2.5 border-t border-[#EDE6DC] bg-[#FBFAF7] p-5">
        <button
          type="button"
          onClick={onSend}
          disabled={empty || sending}
          className="flex h-[52px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-colors disabled:cursor-not-allowed"
          style={{
            background: empty ? "#EDE6DC" : "#E67E22",
            color: empty ? "#a89d8e" : "#FFFFFF",
            boxShadow: empty ? "none" : "0 6px 16px rgba(230,126,34,0.28)",
          }}
        >
          <ChefHat className="size-[18px]" strokeWidth={2} />
          {sending ? "Enviando a cocina…" : "Enviar a cocina"}
          {!empty && !sending && (
            <span className="font-mono text-[13px] font-semibold opacity-90">
              · {count}
            </span>
          )}
        </button>
        <button
          type="button"
          disabled={empty}
          className="flex h-11 items-center justify-center gap-2 rounded-[10px] border bg-white text-[13px] font-semibold transition-colors disabled:cursor-not-allowed"
          style={{
            borderColor: empty ? "#EDE6DC" : "#D8CEC2",
            color: empty ? "#a89d8e" : "#1F1F1F",
          }}
        >
          <Printer className="size-4" strokeWidth={1.8} />
          Imprimir comanda
        </button>
        <span className="text-center text-[10px] text-[#a89d8e]">
          {empty
            ? "Acciones disponibles al agregar el primer producto"
            : `${count} producto${count === 1 ? "" : "s"} · listo para enviar a cocina`}
        </span>
      </div>
    </aside>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6B6660]">{label}</span>
      <span className="font-mono text-[12px] font-medium">{value}</span>
    </div>
  );
}
