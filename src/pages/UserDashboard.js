import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { User, Users, Zap, ArrowLeft, Lock, ArrowUpRight } from "lucide-react";

import irysLogo from "../images/irys.jpeg";
import monadLogo from "../images/monad.png";
import unionLogo from "../images/union.png";
import boundlessLogo from "../images/boundless.jpeg";
import billionsLogo from "../images/billions.jpeg";
import abstractLogo from "../images/abstract.jpg";
import ptblogo from "../images/ptb.jpeg";
import lombardLogo from "../images/lombard.jpeg";
import cysicLogo from "../images/cysic.jpeg";
import anomaLogo from "../images/anoma.jpeg";
import oglabsLogo from "../images/oglabs.jpeg";
import alloraLogo from "../images/allora.jpg";
import megaethLogo from "../images/megaeth.jpeg";
import katanaLogo from "../images/katana.jpg";

// Project data
const PROJECTS = [
  { name: "Irys", logo: irysLogo, slug: "irys", status: "open" },
  { name: "Union", logo: unionLogo, slug: "union", status: "open" },
  { name: "Monad", logo: monadLogo, slug: "monad", status: "open" },
  { name: "Billions", logo: billionsLogo, slug: "billions", status: "open" },
  { name: "Boundless", logo: boundlessLogo, slug: "boundless", status: "open" },
  {
    name: "Portal to BTC",
    logo: ptblogo,
    slug: "portaltobtc",
    status: "open",
  },
  { name: "Cysic", logo: cysicLogo, slug: "cysic", status: "open" },
  { name: "Abstract", logo: abstractLogo, slug: "abstract", status: "close" },
  { name: "Lombard", logo: lombardLogo, slug: "lombard", status: "close" },
  { name: "Anoma", logo: anomaLogo, slug: "anoma", status: "close" },
  { name: "0g Labs", logo: oglabsLogo, slug: "0glabs", status: "close" },
  { name: "Allora", logo: alloraLogo, slug: "allora", status: "close" },
  { name: "MegaETH", logo: megaethLogo, slug: "megaeth", status: "close" },
  { name: "Katana", logo: katanaLogo, slug: "katana", status: "close" },
];

export default function UserDashboard() {
  const { username: rawParam } = useParams();
  const username = (rawParam || "").replace(/^@/, "");

  const [status, setStatus] = useState({ loading: true, error: null });
  const [userStatus, setUserStatus] = useState(null); // /kaito/user_status
  const [yaps, setYaps] = useState(null); // /yap/open

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setStatus({ loading: true, error: null });
      try {
        const [statusRes, yapsRes] = await Promise.all([
          fetch(
            `https://gomtu.xyz/api/kaito/user_status?username=${encodeURIComponent(
              username
            )}`
          ),
          fetch(
            `https://gomtu.xyz/api/yap/open?username=${encodeURIComponent(
              username
            )}`
          ),
        ]);

        if (!statusRes.ok || !yapsRes.ok) {
          throw new Error("Network error fetching user data");
        }

        const statusJson = await statusRes.json();
        const yapsJson = await yapsRes.json();

        if (!cancelled) {
          setUserStatus(statusJson?.data || null);
          setYaps(yapsJson?.data || null);
          setStatus({ loading: false, error: null });
          document.title = `@${username} • Yapium`;
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({ loading: false, error: err.message || "Failed to load" });
        }
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const followerCount = userStatus?.follower_count ?? 0;
  const smartFollowerCount = userStatus?.smart_follower_count ?? 0;
  const totalYaps = yaps?.yaps_all ?? 0;
  const yaps24h = yaps?.yaps_l24h ?? 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F14] text-[#E6EAF2]">
      <BackgroundDecor />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4 md:gap-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </Link>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 backdrop-blur">
          <Zap className="h-3.5 w-3.5" />
          Powered by{" "}
          <a
            href="https://x.com/valordefi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF7A29] hover:underline"
          >
            valordefi
          </a>
        </span>
      </header>

      {/* Layout: Left ~30% (user), Right ~70% (projects) */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-14 pt-4 md:pt-6 lg:grid-cols-10">
        {/* LEFT PANEL (≈30%) */}
        <div className="lg:col-span-3 space-y-4">
          <GlassPanel highlight="orange">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <User className="h-6 w-6 text-[#FF7A29]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/60">
                  User
                </div>
                <div className="text-lg font-semibold">@{username}</div>
              </div>
            </div>
          </GlassPanel>

          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Followers"
            value={formatNumber(followerCount)}
            loading={status.loading}
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Smart Followers"
            value={formatNumber(smartFollowerCount)}
            loading={status.loading}
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Total Yaps"
            value={formatNumber(totalYaps)}
            loading={status.loading}
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="24h Yaps"
            value={formatNumber(yaps24h)}
            loading={status.loading}
          />

          {status.error && (
            <GlassPanel>
              <p className="text-sm text-[#EF4444]">
                Failed to load data. Try again in a bit.
              </p>
            </GlassPanel>
          )}
        </div>

        {/* RIGHT PANEL (≈70%) – Projects list */}
        <div className="lg:col-span-7 space-y-4">
          <GlassPanel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium tracking-wide text-white/80">
                Projects
              </h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
                {PROJECTS.length} listed
              </span>
            </div>

            <ProjectList items={PROJECTS} username={username} />

            {/* Footer note below projects */}
            <div className="mt-4 text-center text-xs text-white/50">
              More work ongoing, expect updates very soon...
            </div>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}

/* ——— Components ——— */

function GlassPanel({ children, highlight }) {
  const neon =
    highlight === "orange"
      ? "0 0 0 1px rgba(255,122,41,0.18), 0 0 40px 2px rgba(255,122,41,0.12)"
      : highlight === "green"
      ? "0 0 0 1px rgba(34,197,94,0.18), 0 0 40px 2px rgba(34,197,94,0.12)"
      : "0 0 0 1px rgba(255,255,255,0.08)";

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 rounded-2xl bg-[#121922]/60 backdrop-blur-xl" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
      <div
        className="pointer-events-none absolute inset-[-1px] rounded-2xl"
        style={{ boxShadow: neon }}
      />
      <div className="relative z-10 p-5">{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value, loading }) {
  return (
    <GlassPanel>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#22C55E] ring-1 ring-white/10">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-white/60">
            {label}
          </div>
          {loading ? (
            <div className="mt-1 h-6 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-0.5 text-lg font-semibold">{value}</div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

function ProjectList({ items, username }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((p) => (
        <ProjectItem key={p.name} project={p} username={username} />
      ))}
    </div>
  );
}

function ProjectItem({ project, username }) {
  const { name, logo, slug, status } = project;
  const isOpen = status === "open";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Routes for open projects
  const target = isOpen
    ? `/p/${slug}/${encodeURIComponent(username)}`
    : undefined;

  const Card = (
    <div
      className={
        "group flex items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-white/10 bg-[#121922]/60 backdrop-blur transition " +
        (isOpen
          ? "hover:ring-white/20 cursor-pointer"
          : "opacity-80 cursor-not-allowed")
      }
      title={isOpen ? `Open ${name} dashboard` : "Coming soon"}
    >
      {/* Avatar / logo */}
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/10 overflow-hidden">
        {logo ? (
          <img src={logo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center bg-gradient-to-br from-[#1f2833] to-[#0d1218] text-white/80 text-sm font-semibold">
            {initials}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-sm text-white/90">{name}</div>

      {/* Status pill */}
      <span
        className={
          "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 " +
          (isOpen
            ? "text-[#22C55E] bg-[#22C55E]/10 ring-white/10"
            : "text-white/60 bg-white/5 ring-white/10")
        }
      >
        {isOpen ? (
          <>
            Open <ArrowUpRight className="h-3 w-3" />
          </>
        ) : (
          <>
            Soon <Lock className="h-3 w-3" />
          </>
        )}
      </span>
    </div>
  );

  // Wrap card with Link only if open
  return isOpen ? <Link to={target}>{Card}</Link> : <div>{Card}</div>;
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
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px, 36px 36px",
          backgroundPosition: "0 0, 0 0",
        }}
      />
      <div className="absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-[#FF7A29]/10 blur-3xl" />
      <div className="absolute right-[-8%] top-[30%] h-80 w-80 rounded-full bg-[#22C55E]/10 blur-3xl" />
    </div>
  );
}

/* ——— Utils ——— */
function formatNumber(n) {
  if (n == null || isNaN(n)) return "–";
  const abs = Math.abs(n);
  const decimals = abs < 1 ? 2 : abs < 1000 ? 2 : 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
