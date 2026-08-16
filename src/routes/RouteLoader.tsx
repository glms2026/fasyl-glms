import { motion } from "framer-motion";

import logo from "@/domains/dashboard/assests/FasylLogo.svg";

interface RouteLoaderProps {
  label?: string;
}

/** Pulsing ellipsis dots that trail the label. */
function LoadingDots() {
  return (
    <span aria-hidden="true" className="ml-1.5 inline-flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1 rounded-full bg-sky-300"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1, 0.9] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: index * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

/**
 * Full-screen loader shown while the session or a lazy route resolves.
 * A navy night scene with the gold FASYL monogram floating in a soft
 * glow, two counter-orbiting ring segments, and a shimmer progress line.
 */
export function RouteLoader({ label = "Loading" }: RouteLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#081735] via-[#0B2148] to-[#12336B]"
    >
      {/* Ambient glow orbs + faint grid, echoing the module heroes. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-6rem] size-96 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="absolute bottom-[-10rem] left-[-8rem] size-[28rem] rounded-full bg-amber-400/10 blur-3xl" />

        <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
          <defs>
            <pattern
              id="loader-grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loader-grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6"
      >
        {/* The mark, floating in a gold glow inside an orbit. */}
        <div className="relative flex size-24 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-pulse rounded-full bg-amber-400/20 blur-2xl"
          />

          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-sky-400/30 border-t-sky-400/80"
            style={{ animationDuration: "1.4s" }}
          />

          <span
            aria-hidden="true"
            className="absolute inset-2 animate-spin rounded-full border border-transparent border-b-amber-300/70"
            style={{
              animationDuration: "2.2s",
              animationDirection: "reverse",
            }}
          />

          <motion.img
            src={logo}
            alt=""
            aria-hidden="true"
            className="relative size-14 drop-shadow-[0_0_28px_rgba(212,160,23,0.5)]"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-xs font-medium tracking-[0.3em] text-white/70 uppercase">
            {label}
            <LoadingDots />
          </p>

          {/* Indeterminate progress shimmer. */}
          <div
            aria-hidden="true"
            className="relative h-1 w-44 overflow-hidden rounded-full bg-white/10"
          >
            <motion.div
              className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-sky-300 to-transparent"
              animate={{ x: ["-120%", "420%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
