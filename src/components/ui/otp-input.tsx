import * as React from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export function OTPInput({ length = 6, value = "", onChange }: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const values = Array.from({ length }, (_, i) => value[i] ?? "");

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const digit = e.target.value.replace(/\D/g, "");

    if (!digit) {
      const next = value.split("");
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    const next = value.padEnd(length, " ").split("");

    next[index] = digit.slice(-1);

    onChange(next.join("").trimEnd());

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (values[index]) {
        const next = [...values];
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) return;

    onChange(pasted);
  };

  return (
    <div className="flex justify-center gap-3">
      {values.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          value={digit}
          maxLength={1}
          inputMode="numeric"
          autoComplete="one-time-code"
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "h-14 w-14 rounded-lg border border-neutral-300 bg-white text-center text-2xl font-semibold",
            "outline-none transition-all",
            "focus:border-black focus:ring-2 focus:ring-black/10",
          )}
        />
      ))}
    </div>
  );
}
