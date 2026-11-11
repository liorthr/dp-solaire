"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

/** pavé de signature manuscrite (souris, doigt, stylet) */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a8a";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  return (
    <div>
      <canvas
        ref={ref}
        data-testid="signature-pad"
        aria-label="Zone de signature : signez avec le doigt ou la souris"
        className="h-36 w-full touch-none rounded-lg border-2 border-dashed border-stone-300 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          const [x, y] = pos(e);
          const ctx = ref.current!.getContext("2d")!;
          ctx.beginPath();
          ctx.moveTo(x, y);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const [x, y] = pos(e);
          const ctx = ref.current!.getContext("2d")!;
          ctx.lineTo(x, y);
          ctx.stroke();
          if (empty) setEmpty(false);
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (!empty) onChange(ref.current!.toDataURL("image/png"));
        }}
      />
      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>Signez dans le cadre ci-dessus</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            const c = ref.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setEmpty(true);
            onChange(null);
          }}
        >
          Effacer
        </Button>
      </div>
    </div>
  );
}
