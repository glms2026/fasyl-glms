import logo from "@/domains/auth/assets/FasylLogo.svg";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-4">
      <img src={logo} alt="FASYL GLMS" className="h-10 w-10" />

      <span className="text-[2rem] font-bold text-white">FASYL</span>

      <span className="text-[2rem] font-semibold text-neutral-300">GLMS</span>
    </div>
  );
}
