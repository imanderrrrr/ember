"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  "Toda gran noche empieza con una operación impecable.",
  "El detalle invisible es el que define la mesa memorable.",
  "Cocinar es servir; servir es cuidar.",
  "El fuego se respeta; la sala se escucha.",
  "Un servicio sin alma es solo despacho.",
  "La brasa enseña paciencia; el cliente exige presencia.",
  "Cada plato cuenta una historia; cada mesa, un encuentro.",
  "La excelencia no es un acto, es un hábito que se cocina cada noche.",
  "El sabor empieza en la disciplina del prep.",
  "El silencio entre comandas también es servicio.",
  "Un buen anfitrión escucha antes de hablar.",
  "El maridaje no se sugiere, se ofrece como cuidado.",
  "La cocina canta cuando la sala respira.",
  "No hay segunda oportunidad para una primera mesa.",
  "Servicio es teatro: ensayar lo invisible para que se vea natural.",
  "El producto manda; el servicio acompaña; el invitado decide volver.",
  "Lo que no se mide en sala, se siente al cobrar.",
  "La cocina de brasas exige verdad: el fuego no perdona el descuido.",
  "Hospitalidad es recordar nombres y olvidar prisas.",
  "Un turno bien cerrado es la mitad del siguiente abierto.",
];

export function PhilosophyCard() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 300);
      return () => clearTimeout(t);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col justify-between gap-5 rounded-[16px] border border-[#EDE6DC] bg-[#F7F3EE] p-8 shadow-[0_4px_16px_rgba(107,79,58,0.08)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.18em] text-[#A89D8E]">
          EMBER · SERVICE PHILOSOPHY
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[#A89D8E]">
          {String(index + 1).padStart(2, "0")} / {String(QUOTES.length).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-1 items-center">
        <p
          className={`font-sans text-[26px] font-semibold leading-snug tracking-[-0.015em] text-[#1F1F1F] transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          &ldquo;{QUOTES[index]}&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span aria-hidden className="block h-[1.5px] w-9 bg-[#C2410C]" />
        <span className="font-mono text-[11px] font-bold tracking-[0.22em] text-[#6B4F3A]">
          EMBER
        </span>
      </div>
    </div>
  );
}
