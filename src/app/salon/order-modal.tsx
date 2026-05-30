"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Info,
  Minus,
  Plus,
  Save,
  Search,
  SendHorizontal,
  SlidersHorizontal,
  StickyNote,
  X,
} from "lucide-react";
import type { SalonTable } from "./_lib/types";
import {
  CATALOG,
  CATEGORIES,
  IVA_RATE,
  formatQ,
  type CartLine,
  type Product,
} from "./_lib/menu";

/**
 * Modal "Abrir pedido".
 *
 * Implementación fiel al frame `Salón en vivo - Modal Abrir pedido` del
 * `.pen`. Todos los datos son mock — todavía no hay módulo de productos ni
 * de órdenes en el backend. Lo único que sí tiene efecto real es el botón
 * "Enviar a cocina", que dispara `onSendToKitchen` (cambia el estado de
 * la mesa a `cocina` via API).
 *
 * Interactividad mock:
 *   - Cambiar categoría en el sidebar → muestra otros productos.
 *   - "+" en un producto → lo agrega al carrito.
 *   - "−" / "x" en el carrito → quita unidades / elimina la línea.
 *   - Los totales recalculan en vivo.
 *
 * Ninguno de estos cambios se persiste — todo vive en estado local.
 */

/**
 * Carrito inicial: refleja el pedido mock que se muestra también en el
 * panel derecho del salón (TOTAL Q898). Cuando exista el módulo real de
 * órdenes, esto vendrá del backend.
 */
const INITIAL_CART: CartLine[] = [
  { productId: "ent-1", name: "Tartar de atún", unitPrice: 89, qty: 2 },
  { productId: "pri-1", name: "Risotto de hongos", unitPrice: 95, qty: 1 },
  { productId: "car-1", name: "Cordero al horno", unitPrice: 165, qty: 2 },
  { productId: "vin-1", name: "Vino Ribera del Duero", unitPrice: 295, qty: 1 },
];

export function OrderModal({
  table,
  onClose,
  onSendToKitchen,
  sending,
}: {
  table: SalonTable;
  onClose: () => void;
  /** Marca la mesa como "en cocina" en el backend. Promesa para feedback de loading. */
  onSendToKitchen: () => Promise<void>;
  sending: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("entradas");
  const [cart, setCart] = useState<CartLine[]>(INITIAL_CART);

  // Totales: las price unitarios incluyen IVA, así que descomponemos.
  // gross = subtotal + IVA; subtotal = gross / 1.12; iva = gross - subtotal.
  const totals = useMemo(() => {
    const gross = cart.reduce((acc, l) => acc + l.unitPrice * l.qty, 0);
    const subtotal = gross / (1 + IVA_RATE);
    const iva = gross - subtotal;
    return { subtotal, iva, gross };
  }, [cart]);

  // Esc cierra; bloqueo de scroll del body mientras está abierto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sending, onClose]);

  const addToCart = (p: Product) => {
    setCart((c) => {
      const existing = c.find((l) => l.productId === p.id);
      if (existing) {
        return c.map((l) =>
          l.productId === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...c, { productId: p.id, name: p.name, unitPrice: p.price, qty: 1 }];
    });
  };

  const decrementLine = (productId: string) => {
    setCart((c) =>
      c
        .map((l) =>
          l.productId === productId ? { ...l, qty: l.qty - 1 } : l,
        )
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (productId: string) => {
    setCart((c) => c.filter((l) => l.productId !== productId));
  };

  const products = CATALOG[activeCategory] ?? [];
  const categoryLabel =
    CATEGORIES.find((c) => c.key === activeCategory)?.label ?? "";
  const categoryProductCount =
    CATEGORIES.find((c) => c.key === activeCategory)?.count ?? products.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={sending ? undefined : onClose}
        className="absolute inset-0 cursor-default bg-[#1F1F1F66] backdrop-blur-[2px]"
      />

      {/* Modal card */}
      <div
        className="relative flex h-[780px] w-[1280px] flex-col overflow-hidden rounded-[18px] border border-[#EDE6DC] bg-white"
        style={{ boxShadow: "0 32px 80px 0 #1F1F1F40" }}
      >
        <ModalHeader
          table={table}
          cartCount={cart.reduce((acc, l) => acc + l.qty, 0)}
          onClose={onClose}
          sending={sending}
        />

        <div className="flex flex-1 overflow-hidden">
          <CategorySidebar
            active={activeCategory}
            onSelect={setActiveCategory}
          />
          <ProductsColumn
            label={categoryLabel}
            count={categoryProductCount}
            products={products}
            onAdd={addToCart}
          />
          <OrderColumn
            cart={cart}
            totals={totals}
            notes={table.notes}
            onDecrement={decrementLine}
            onRemove={removeLine}
          />
        </div>

        <ModalFooter
          sending={sending}
          canSend={cart.length > 0}
          onCancel={onClose}
          onSend={() => void onSendToKitchen()}
        />
      </div>
    </div>
  );
}

/* ───────── Header ───────── */

function ModalHeader({
  table,
  cartCount,
  onClose,
  sending,
}: {
  table: SalonTable;
  cartCount: number;
  onClose: () => void;
  sending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#EDE6DC] bg-white px-7 pb-5 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2
            id="order-modal-title"
            className="text-[22px] font-bold leading-tight text-[#1F1F1F]"
            style={{ letterSpacing: "-0.3px" }}
          >
            Abrir pedido
          </h2>
          <p className="text-[13px] leading-[1.4] text-[#6B4F3A]">
            Toma la comanda y envíala a cocina cuando esté lista.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          aria-label="Cerrar"
          className="flex size-9 items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white text-[#1F1F1F] hover:bg-[#F7F3EE] disabled:opacity-50"
        >
          <X className="size-4" strokeWidth={1.8} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip label="MESA" value={table.label} valueMono />
        <Chip
          label="COMENSALES"
          value={table.partySize !== null ? String(table.partySize) : "—"}
          valueMono
        />
        <Chip label="MESERO" value="Andrés López" />
        <Chip label="PRODUCTOS" value={String(cartCount)} valueMono bold />
        <ChipStatus />
      </div>
    </div>
  );
}

function Chip({
  label,
  value,
  valueMono,
  bold,
}: {
  label: string;
  value: string;
  valueMono?: boolean;
  bold?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-1.5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
        {label}
      </span>
      <span
        className={`text-[12px] text-[#1F1F1F] ${
          valueMono ? "font-mono" : ""
        } ${bold ? "font-bold" : "font-semibold"}`}
      >
        {value}
      </span>
    </span>
  );
}

function ChipStatus() {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#EDE6DC] px-3 py-1.5">
      <span className="block size-1.5 rounded-full bg-[#7C8A6A]" />
      <span className="text-[12px] font-medium text-[#7C8A6A]">
        Comanda lista
      </span>
    </span>
  );
}

/* ───────── Category sidebar ───────── */

function CategorySidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col gap-4 border-r border-[#EDE6DC] bg-[#F7F3EE] px-6 py-6">
      <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
        CATEGORÍAS
      </span>
      <div className="flex flex-col gap-1.5">
        {CATEGORIES.map((c) => {
          const isActive = c.key === active;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.key)}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors"
              style={{
                background: isActive ? "#FBE7D6" : "#FFFFFF",
                border: isActive ? "1.5px solid #E67E22" : "1px solid #EDE6DC",
              }}
            >
              <Icon
                className="size-3.5 shrink-0"
                strokeWidth={1.8}
                style={{ color: isActive ? "#E67E22" : "#6B4F3A" }}
              />
              <span
                className="flex-1 text-left text-[13px] text-[#1F1F1F]"
                style={{ fontWeight: isActive ? 600 : 500 }}
              >
                {c.label}
              </span>
              <span
                className="font-mono text-[11px]"
                style={{
                  color: isActive ? "#E67E22" : "#6B6660",
                  fontWeight: 500,
                }}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <div className="flex items-start gap-2.5 rounded-[10px] border border-[#EDE6DC] bg-white px-3 py-3">
        <Info className="mt-0.5 size-3.5 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
        <span className="text-[11px] leading-[1.5] text-[#6B4F3A]">
          El pedido se envía a cocina al confirmar. Antes puedes guardarlo
          como borrador.
        </span>
      </div>
    </aside>
  );
}

/* ───────── Products column ───────── */

function ProductsColumn({
  label,
  count,
  products,
  onAdd,
}: {
  label: string;
  count: number;
  products: Product[];
  onAdd: (p: Product) => void;
}) {
  return (
    <section className="flex flex-1 flex-col gap-4 overflow-hidden border-r border-[#EDE6DC] bg-white px-7 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[16px] font-semibold text-[#1F1F1F]">{label}</h3>
          <span className="text-[13px] text-[#6B6660]">· {count} productos</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1"
        >
          <SlidersHorizontal className="size-3 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[11px] font-medium text-[#6B4F3A]">Filtrar</span>
        </button>
      </div>
      <div className="flex items-center gap-2.5 rounded-xl border border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-2.5">
        <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
        <span className="flex-1 text-[13px] text-[#a89d8e]">
          Buscar producto en el menú…
        </span>
        <span className="rounded border border-[#EDE6DC] bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#6B4F3A]">
          ⌘ K
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {products.length === 0 ? (
          <span className="rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-2 text-center text-[12px] text-[#6B6660]">
            Aún no hay productos en esta categoría.
          </span>
        ) : (
          products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={() => onAdd(p)} />
          ))
        )}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-[#EDE6DC] bg-white p-3.5">
      <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#EDE6DC]">
        <ImageIcon className="size-5 text-[#a89d8e]" strokeWidth={1.8} />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-[14px] font-semibold text-[#1F1F1F]">
          {product.name}
        </span>
        <span className="text-[12px] leading-[1.4] text-[#6B4F3A]">
          {product.desc}
        </span>
        <span className="font-mono text-[13px] font-bold text-[#1F1F1F]">
          {formatQ(product.price)}
        </span>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Agregar ${product.name} al pedido`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1F1F1F] text-white hover:bg-[#3a322c]"
      >
        <Plus className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

/* ───────── Order column ───────── */

function OrderColumn({
  cart,
  totals,
  notes,
  onDecrement,
  onRemove,
}: {
  cart: CartLine[];
  totals: { subtotal: number; iva: number; gross: number };
  notes: string | null;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <aside className="flex w-[440px] shrink-0 flex-col gap-4 overflow-y-auto bg-[#F7F3EE] px-7 py-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
          PEDIDO ACTUAL
        </span>
        <span className="text-[11px] text-[#6B4F3A]">
          {cart.length} {cart.length === 1 ? "producto" : "productos"}
        </span>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EDE6DC] bg-white">
        {cart.length === 0 ? (
          <span className="px-4 py-8 text-center text-[12.5px] text-[#6B6660]">
            Aún no hay productos en el pedido. Selecciona del menú para
            empezar.
          </span>
        ) : (
          cart.map((line, i) => (
            <CartRow
              key={line.productId}
              line={line}
              divider={i < cart.length - 1}
              onDecrement={() => onDecrement(line.productId)}
              onRemove={() => onRemove(line.productId)}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl border border-[#EDE6DC] bg-white p-4">
        <TotalRow label="Subtotal" value={formatQ(totals.subtotal)} />
        <TotalRow label="IVA 12%" value={formatQ(totals.iva)} />
        <div className="h-px w-full bg-[#EDE6DC]" />
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[#1F1F1F]">
            TOTAL
          </span>
          <span className="font-mono text-[20px] font-bold text-[#1F1F1F]">
            {formatQ(totals.gross)}
          </span>
        </div>
      </div>

      {notes && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#EDE6DC] bg-white p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
                NOTAS PARA COCINA
              </span>
            </div>
            <button
              type="button"
              className="text-[11px] font-semibold text-[#E67E22]"
            >
              Editar
            </button>
          </div>
          <p className="text-[12.5px] leading-[1.5] text-[#1F1F1F]">{notes}</p>
        </div>
      )}
    </aside>
  );
}

function CartRow({
  line,
  divider,
  onDecrement,
  onRemove,
}: {
  line: CartLine;
  divider: boolean;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        borderBottom: divider ? "1px solid #EDE6DC" : undefined,
      }}
    >
      <span className="flex items-center gap-1 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2 py-1">
        <button
          type="button"
          onClick={onDecrement}
          aria-label={`Restar uno de ${line.name}`}
          className="text-[#6B4F3A] hover:text-[#C95A3D]"
        >
          <Minus className="size-3" strokeWidth={2} />
        </button>
        <span className="min-w-[20px] text-center font-mono text-[11px] font-bold text-[#6B4F3A]">
          x{line.qty}
        </span>
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-[#1F1F1F]">
          {line.name}
        </span>
        <span className="font-mono text-[10px] text-[#a89d8e]">
          {formatQ(line.unitPrice)} c/u
        </span>
      </div>
      <span className="font-mono text-[13px] font-semibold text-[#1F1F1F]">
        {formatQ(line.unitPrice * line.qty)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Eliminar ${line.name}`}
        className="flex size-6 items-center justify-center rounded-full bg-[#F7F3EE] text-[#6B4F3A] hover:bg-[#C95A3D14] hover:text-[#C95A3D]"
      >
        <X className="size-3" strokeWidth={2} />
      </button>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6B6660]">{label}</span>
      <span className="font-mono text-[12px] font-medium text-[#1F1F1F]">
        {value}
      </span>
    </div>
  );
}

/* ───────── Footer ───────── */

function ModalFooter({
  sending,
  canSend,
  onCancel,
  onSend,
}: {
  sending: boolean;
  canSend: boolean;
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#EDE6DC] bg-white px-7 py-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={sending}
        className="flex items-center gap-1.5 rounded-md px-1 py-2 text-[13px] font-medium text-[#6B4F3A] hover:text-[#1F1F1F] disabled:opacity-50"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.8} />
        Cancelar
      </button>
      <div className="flex items-center gap-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] text-[#a89d8e]">
          <Save className="size-3" strokeWidth={1.8} />
          Auto-guardado hace 4s
        </span>
        <button
          type="button"
          disabled={sending}
          className="rounded-[10px] border border-[#1F1F1F] bg-white px-[18px] py-3 text-[13px] font-semibold text-[#1F1F1F] hover:bg-[#F7F3EE] disabled:opacity-50"
        >
          Guardar borrador
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !canSend}
          className="flex items-center gap-2 rounded-[10px] bg-[#E67E22] px-[18px] py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#c2410c] disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Enviar a cocina"}
          {!sending && (
            <SendHorizontal className="size-3.5" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
