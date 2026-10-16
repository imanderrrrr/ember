"use client";

interface SlotCellProps {
  time: string;
  note: string;
  tone: "good" | "limited" | "closed";
  selected: boolean;
  onClick: () => void;
}

export function SlotCell({
  time,
  note,
  tone,
  selected,
  onClick,
}: SlotCellProps) {
  const isClosed = tone === "closed";
  const isSelected = selected && !isClosed;
  const displayNote = isSelected ? "Seleccionada" : note;

  const timeColor = isSelected ? "#FFFFFF" : isClosed ? "#a89d8e" : "#1f1f1f";
  const noteColor = isSelected
    ? "#fbe7d6"
    : tone === "good"
      ? "#7c8a6a"
      : tone === "limited"
        ? "#d8a641"
        : "#c95a3d";

  return (
    <button
      type="button"
      onClick={isClosed ? undefined : onClick}
      disabled={isClosed}
      className="flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-[10px]"
      style={{
        background: isSelected ? "#e67e22" : "transparent",
        border: isSelected ? "none" : "1px solid #ede6dc",
        cursor: isClosed ? "default" : "pointer",
      }}
    >
      <span
        className="font-mono text-[16px] leading-none"
        style={{
          color: timeColor,
          fontWeight: isSelected ? 700 : isClosed ? 500 : 700,
        }}
      >
        {time}
      </span>
      <span
        className="text-[10px] font-semibold"
        style={{ color: noteColor }}
      >
        {displayNote}
      </span>
    </button>
  );
}
