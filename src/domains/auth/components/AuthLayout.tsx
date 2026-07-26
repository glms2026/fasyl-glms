import { type ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import authBg from "@/domains/auth/assets/authBg.jpg";
import threedBg from "@/domains/auth/assets/threedBg.jpg";
import { SecurityBadges } from "./SecurityBadges";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white w-full bg-cover bg-center">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* LEFT PANEL */}

        <aside
          style={{ backgroundImage: `url(${authBg})` }}
          className="relative hidden h-full w-full overflow-hidden bg-[#001a42] bg-cover bg-center bg-no-repeat text-white lg:flex"
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#001a42]/90" />

          {/* Content */}
          <div className="relative z-10 flex h-full w-full flex-col px-10 py-12">
            {/* Logo */}
            <BrandLogo />

            {/* Hero */}
            <div className="flex flex-1 items-center">
              <div className="max-w-lg">
                <h1 className="text-[56px] font-bold leading-[1.05] tracking-tight">
                  GL Management
                  <br />
                  System
                </h1>

                <div className="mt-10 border-l-4 border-neutral-200 pl-5">
                  <p className="text-lg leading-9 text-neutral-300">
                    Access the General Ledger Management System. Our
                    enterprise-grade security protocols ensure the integrity of
                    every financial instrument and audit trail within the fiscal
                    ecosystem.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <SecurityBadges />
          </div>
        </aside>
        {/* RIGHT PANEL */}

        <main
          style={{
            backgroundImage: `
      linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.15)),
      url(${threedBg})
    `,
          }}
          className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-8"
        >
          {/* Background glow */}
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          {/* Glass Card */}
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
