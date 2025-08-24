import { useState } from "react";
import { Search, Rocket, Flame, TrendingUp, Zap } from "lucide-react";
import yapiumLogo from "../images/yapium.png";

/**
 * Hope – Home UI (React + Tailwind)
 * Copy updated to degen-mode: short, logical, no fluff.
 * Curated Projects section removed.
 */

export default function HopeHome() {
  const [username, setUsername] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const u = username.trim().replace(/^@/, "");
    if (!u) return;
    window.location.href = `/u/${u}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F14] text-[#E6EAF2]">
      <BackgroundDecor />
      {/* Top bar / Logo area */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FF7A29] ring-1 ring-[#FF7A29]/40 shadow-[0_0_24px_#FF7A29] flex items-center justify-center overflow-hidden">
            <img
              src={yapiumLogo}
              alt="Yapium Logo"
              className="h-6 w-6 object-contain"
            />
          </div>

          <h1 className="text-lg font-semibold tracking-tight md:text-xl heading">
            Yapium
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            icon={<Zap className="h-3.5 w-3.5" />}
            label={
              <>
                Powered by{" "}
                <a
                  href="https://x.com/valordefi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF7A29] hover:underline"
                >
                  valordefi
                </a>
              </>
            }
          />
        </div>
      </header>
      {/* Hero / Search */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-14 pt-8 text-center md:pt-16">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70 backdrop-blur">
          Built For Yappers who love hopium.
        </p>
        <h2 className="max-w-3xl text-balance text-3xl font-semibold leading-tight  tracking-tight md:text-5xl heading">
          Give yourself a doze of hopium like never before.
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-sm text-[#A8B0BD] md:mt-4 md:text-base">
          Enter your X username and see what your ranks are worth.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 w-full max-w-xl"
          role="search"
          aria-label="Search by X username"
        >
          <div className="group relative isolate">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[#121922]/60 backdrop-blur-xl" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
            <div
              className="pointer-events-none absolute inset-[-1px] rounded-2xl opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,122,41,0.2), 0 0 40px 2px rgba(255,122,41,0.15)",
              }}
            />

            <div className="relative flex items-center gap-2 p-2 pl-3">
              <Search className="h-5 w-5 flex-none text-white/50" />
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="@yourhandle"
                className="w-full rounded-xl bg-transparent px-1 py-3 text-base outline-none placeholder:text-white/40 md:text-lg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <NeonButton type="submit">Scan</NeonButton>
            </div>
          </div>
          <p className="mt-2 text-left text-xs text-white/50">
            Type with or without @ — both work.
          </p>
        </form>

        {/* Showcase cards */}
        <div className="mt-12 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Allocations"
            sub="See how much you might get if you're yapping the right bags."
          />
          <FeatureCard
            icon={<Flame className="h-5 w-5" />}
            title="Hopium Index"
            sub="Simulate what your bags could be worth at different FDVs."
          />
          <FeatureCard
            icon={<Rocket className="h-5 w-5" />}
            title="Sleek Interface"
            sub="UI so fun you’ll forget the bags are still underwater."
          />
        </div>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-12 pt-8 text-xs text-white/50 text-center">
        <p>
          Numbers shown are estimates only and exist purely for hopium. Nothing
          here is guaranteed.
        </p>
      </footer>
    </main>
  );
}

function Badge({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 backdrop-blur">
      {icon}
      {label}
    </span>
  );
}

function NeonButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "relative inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-medium tracking-wide transition-transform will-change-transform " +
        "bg-[#FF7A29] text-black hover:scale-[1.02] active:scale-[0.99] " +
        "shadow-[0_0_24px_rgba(255,122,41,0.5)] " +
        className
      }
      style={{ textShadow: "0 0 10px rgba(0,0,0,0.25)" }}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon, title, sub }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 rounded-2xl bg-[#121922]/60 backdrop-blur-xl" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
      <div
        className="pointer-events-none absolute inset-[-1px] rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow:
            "0 0 0 1px rgba(34,197,94,0.18), 0 0 40px 2px rgba(34,197,94,0.14)",
        }}
      />
      <div className="relative z-10 flex items-center gap-3 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#22C55E] ring-1 ring-white/10">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium tracking-wide">{title}</div>
          <div className="text-xs text-white/60">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% -10%, rgba(255,122,41,0.08), transparent 55%)," +
            "radial-gradient(1000px 500px at 80% 110%, rgba(34,197,94,0.07), transparent 55%)," +
            "linear-gradient(180deg, #0B0F14 0%, #11161C 100%)",
        }}
      />
      <GridOverlay />
      <div className="absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-[#FF7A29]/10 blur-3xl" />
      <div className="absolute right-[-8%] top-[30%] h-80 w-80 rounded-full bg-[#22C55E]/10 blur-3xl" />
    </div>
  );
}

function GridOverlay() {
  return (
    <div
      className="absolute inset-0 opacity-[0.12]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
        backgroundSize: "36px 36px, 36px 36px",
        backgroundPosition: "0 0, 0 0",
      }}
    />
  );
}
