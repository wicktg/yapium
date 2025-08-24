import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Zap, Info, X } from "lucide-react";

/**
 * BILLIONS Project Dashboard
 * - topic_id === "BILLIONS"
 * - Time weighting: 3M > 30D > 6M
 * - Leaderboards weighting: tier1 (Creator) > tier2 (Community). No "specific".
 * - Rewards pool: 10M $BLNS out of 1B total supply (assumed supply for price calc)
 * - Global mindshare pool: 365 (assumption)
 * - Eligibility: min rank ≤ 1000 AND positive weighted score
 *   - Prefer mindshare (if present) → mindshare-weighted score
 *   - If ALL mindshare are null/absent → fallback to rank-weighted score (reduced influence)
 * - FDV slider: $0 → $5B, price = FDV / totalSupply
 */

const TOTAL_SUPPLY = 1_000_000_000; // 1B
const REWARD_POOL = 10_000_000; // 10M BLNS
const GLOBAL_MINDSHARE = 450; // assumed global mindshare

// Time weights: 3M > 30D > 6M
const TIME_WEIGHTS = { "3M": 1.0, "30D": 0.8, "6M": 0.5 };
// Leaderboard weights (no "specific")
const TIER_WEIGHTS = { tier1: 1.0, tier2: 0.7 };
// Included durations
const INCLUDED_DURATIONS = new Set(["3M", "30D", "6M"]);

// Rank-fallback tuning: rank contribution is intentionally weaker than mindshare.
const RANK_PENALTY = 0.35; // dampens rank vs mindshare
// Map rank (1..1000) → base score in [0,1], rank 1 ≈ 1.0, rank 1000 ≈ 0.001
function rankToUnitScore(rank) {
  if (!Number.isFinite(rank) || rank <= 0) return 0;
  if (rank > 1000) return 0;
  return (1001 - rank) / 1000; // 1.0 for #1, 0.001 for #1000
}

export default function ProjectBillions() {
  const { username: rawParam } = useParams();
  const username = (rawParam || "").replace(/^@/, "");

  const [status, setStatus] = useState({ loading: true, error: null });
  const [entries, setEntries] = useState([]);
  const [fdv, setFdv] = useState(1_000_000_000); // default $1B
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus({ loading: true, error: null });
      try {
        const res = await fetch(
          `https://gomtu.xyz/api/kaito/leaderboard-search?username=${encodeURIComponent(
            username
          )}`
        );
        if (!res.ok) throw new Error("Network error");
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        // Keep BILLIONS + included durations
        const filtered = data.filter(
          (d) =>
            d?.topic_id === "BILLIONS" && INCLUDED_DURATIONS.has(d?.duration)
        );

        if (!cancelled) {
          setEntries(filtered);
          setStatus({ loading: false, error: null });
          document.title = `BILLIONS • ${username} • Yapium`;
        }
      } catch (e) {
        if (!cancelled) {
          setStatus({ loading: false, error: e.message || "Failed to load" });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Weighted score (mindshare preferred; fallback to ranks if ALL mindshare are null/absent)
  const {
    weightedScore, // final score used for rewards
    usedMindshare, // true if using mindshare; false if rank fallback
    eligible,
    bestRank,
  } = useMemo(() => {
    if (!entries.length)
      return {
        weightedScore: 0,
        usedMindshare: false,
        eligible: false,
        bestRank: null,
      };

    let wm = 0; // mindshare-weighted
    let minRank = Infinity;
    let sawMindshare = false;

    for (const e of entries) {
      const duration = e?.duration;
      const tier = (e?.tier || "").toLowerCase(); // tier1 / tier2
      const ms =
        typeof e?.mindshare === "number" ? Math.max(0, e.mindshare) : null;
      const rank = typeof e?.rank === "number" ? e.rank : Infinity;

      const tWeight = TIME_WEIGHTS[duration] ?? 0;
      const tierWeight = TIER_WEIGHTS[tier] ?? 0;

      if (ms !== null) {
        sawMindshare = true;
        wm += ms * tWeight * tierWeight;
      }
      if (rank < minRank) minRank = rank;
    }

    // Prefer mindshare if present and positive
    if (sawMindshare && wm > 0) {
      const isEligible = minRank <= 1000 && wm > 0;
      return {
        weightedScore: wm,
        usedMindshare: true,
        eligible: isEligible,
        bestRank: isFinite(minRank) ? minRank : null,
      };
    }

    // Fallback to ranks (reduced influence)
    let wr = 0;
    for (const e of entries) {
      const duration = e?.duration;
      const tier = (e?.tier || "").toLowerCase();
      const rank = typeof e?.rank === "number" ? e.rank : Infinity;

      const tWeight = TIME_WEIGHTS[duration] ?? 0;
      const tierWeight = TIER_WEIGHTS[tier] ?? 0;
      const unit = rankToUnitScore(rank); // [0..1], 0 if > 1000

      wr += unit * tWeight * tierWeight;
    }
    wr *= RANK_PENALTY;

    const isEligible = isFinite(minRank) && minRank <= 1000 && wr > 0;
    return {
      weightedScore: wr,
      usedMindshare: false,
      eligible: isEligible,
      bestRank: isFinite(minRank) ? minRank : null,
    };
  }, [entries]);

  // Rewards + pricing
  const tokensAwarded = useMemo(() => {
    if (!weightedScore || GLOBAL_MINDSHARE <= 0) return 0;
    const share = weightedScore / GLOBAL_MINDSHARE;
    return Math.max(0, REWARD_POOL * share);
  }, [weightedScore]);

  const tokenPrice = useMemo(() => (fdv > 0 ? fdv / TOTAL_SUPPLY : 0), [fdv]);
  const rewardWorthUSD = useMemo(
    () => tokensAwarded * tokenPrice,
    [tokensAwarded, tokenPrice]
  );

  const sliderDisabled = !eligible;

  // Tagline by worth
  const tagline = useMemo(() => {
    const w = Math.floor(rewardWorthUSD);
    if (w >= 100_000) return "Time for a vacation"; // 6 figs
    if (w >= 10_000) return "I cooked very hard"; // 5 figs
    if (w >= 1_000) return "4 figures, who dis?"; // 4 figs
    if (w >= 100) return "I printed a good bags"; // 3 figs
    return "We go again";
  }, [rewardWorthUSD]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F14] text-[#E6EAF2]">
      <BackgroundDecor />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4 md:gap-5">
          <Link
            to={`/u/${username}`}
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

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-14 pt-4 md:pt-6 lg:grid-cols-10">
        {/* LEFT: Eligibility + Rewards (~60%) */}
        <div className="lg:col-span-6 space-y-4">
          <GlassPanel highlight="orange">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/60">
                  User
                </div>
                <div className="text-lg font-semibold">@{username}</div>
              </div>
              {status.loading ? (
                <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
              ) : (
                <EligibilityPill eligible={eligible} bestRank={bestRank} />
              )}
            </div>

            {/* Summary stats */}
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MiniStat label="Simulated FDV" value={formatFDV(fdv)} />
              <MiniStat
                label="TOKENS"
                value={`${formatQty(tokensAwarded, 2)} $BLNS`}
              />
              <MiniStat
                label="Token Price ($)"
                value={formatPrice(tokenPrice, 6)}
              />
              <MiniStat
                label="Reward Worth ($)"
                value={formatMoney(rewardWorthUSD, 2)}
              />
            </div>
          </GlassPanel>

          <GlassPanel>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium tracking-wide text-white/80">
                  FDV Simulator
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Drag to simulate token price and reward value.
                </p>
              </div>

              {!eligible && !status.loading && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
                  Locked (not eligible)
                </span>
              )}
            </div>

            <div className={`mt-4 ${sliderDisabled ? "opacity-50" : ""}`}>
              <input
                type="range"
                min={0}
                max={5_000_000_000}
                step={1_000_000}
                value={fdv}
                onChange={(e) => setFdv(Number(e.target.value))}
                className="w-full accent-[#FF7A29]"
                disabled={sliderDisabled}
              />
              <div className="mt-2 flex justify-between text-xs text-white/60">
                <span>$0</span>
                <span>$1B</span>
                <span>$5B</span>
              </div>
            </div>
          </GlassPanel>

          <div className="flex flex-wrap gap-3">
            <NeonButton
              onClick={() => setShowCard(true)}
              disabled={!eligible}
              className={!eligible ? "opacity-60 cursor-not-allowed" : ""}
            >
              Generate Card
            </NeonButton>
          </div>
        </div>

        {/* RIGHT: How are the rewards calculated? (~40%) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassPanel>
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#FF7A29]" />
              <h3 className="text-sm font-medium tracking-wide text-white/80">
                How are the rewards calculated?
              </h3>
            </div>

            <ul className="pl-5 text-sm text-white/70 space-y-2 list-disc">
              <li>
                <span className="text-white/80">Total Supply:</span>{" "}
                <b>1,000,000,000 $BLNS</b>.
              </li>
              <li>
                <span className="text-white/80">
                  Rewards Pool for Yappers Assumed:
                </span>{" "}
                <b>10,000,000 $BLNS</b>.
              </li>
              <li>
                <span className="text-white/80">Timeframe Weightage:</span>{" "}
                <b>3M</b> &gt; <b>30D</b> &gt; <b>6M</b>.
              </li>
              <li>
                <span className="text-white/80">Leaderboard Weightage:</span>{" "}
                <b>Creator leaderboard</b> &gt; <b>Community leaderboard</b>.
              </li>
              <li>
                <span className="text-white/80">Distribution:</span> Your{" "}
                <b>weighted mindshare</b> determines your share of the pool.
              </li>
            </ul>
          </GlassPanel>
        </div>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-2 text-center text-xs text-white/50">
        Numbers shown are estimates only and exist purely for hopium. Nothing
        here is guaranteed.
      </footer>

      {/* Card Modal */}
      {showCard && (
        <CardModal
          onClose={() => setShowCard(false)}
          username={username}
          tokens={tokensAwarded}
          worth={rewardWorthUSD}
          fdv={fdv}
          tagline={tagline}
        />
      )}
    </main>
  );
}

/* ——— Card Modal ——— */

function CardModal({ onClose, username, tokens, worth, fdv, tagline }) {
  const svgRef = useRef(null);

  async function downloadPNG() {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200; // export crisp
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngURL = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngURL;
      a.download = `yapium_${username}_billions_card.png`;
      a.click();
    };
    img.src = url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl ring-1 ring-white/10 bg-[#0B0F14] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-white/70">Share Card Preview</div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Smaller preview */}
        <div className="bg-[#0B0F14] px-3 pb-4">
          <div className="mx-auto w-[720px] max-w-full overflow-hidden rounded-xl ring-1 ring-white/10">
            <svg
              ref={svgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 630"
              width="100%"
              height="auto"
            >
              {/* Background */}
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B0F14" />
                  <stop offset="100%" stopColor="#11161C" />
                </linearGradient>
                <radialGradient id="glowO" cx="0.2" cy="0.0" r="0.8">
                  <stop offset="0%" stopColor="rgba(255,122,41,0.25)" />
                  <stop offset="60%" stopColor="rgba(255,122,41,0.0)" />
                </radialGradient>
                <radialGradient id="glowG" cx="0.8" cy="1.1" r="0.8">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.2)" />
                  <stop offset="60%" stopColor="rgba(34,197,94,0.0)" />
                </radialGradient>
              </defs>

              <rect width="1200" height="630" fill="url(#g1)" />
              <rect width="1200" height="630" fill="url(#glowO)" />
              <rect width="1200" height="630" fill="url(#glowG)" />

              {/* Title */}
              <text
                x="60"
                y="100"
                fill="#E6EAF2"
                fontFamily="Inter, system-ui"
                fontSize="48"
                fontWeight="700"
              >
                Yapium • BILLIONS Rewards
              </text>

              {/* Username */}
              <text
                x="60"
                y="160"
                fill="#A8B0BD"
                fontFamily="Inter, system-ui"
                fontSize="24"
              >
                @{username}
              </text>

              {/* Worth box */}
              <g>
                <rect
                  x="60"
                  y="200"
                  rx="18"
                  ry="18"
                  width="520"
                  height="200"
                  fill="rgba(18,25,34,0.6)"
                  stroke="rgba(255,255,255,0.1)"
                />
                <text
                  x="80"
                  y="240"
                  fill="rgba(255,255,255,0.6)"
                  fontFamily="Inter, system-ui"
                  fontSize="16"
                  style={{ letterSpacing: "0.08em" }}
                >
                  WORTH ($)
                </text>
                <text
                  x="80"
                  y="305"
                  fill="#E6EAF2"
                  fontFamily="Inter, system-ui"
                  fontSize="48"
                  fontWeight="800"
                >
                  {formatMoney(worth, 2)}
                </text>
                <text
                  x="80"
                  y="345"
                  fill="#A8B0BD"
                  fontFamily="Inter, system-ui"
                  fontSize="18"
                >
                  at {formatFDV(fdv)} FDV
                </text>
              </g>

              {/* Tokens box */}
              <g>
                <rect
                  x="620"
                  y="200"
                  rx="18"
                  ry="18"
                  width="520"
                  height="200"
                  fill="rgba(18,25,34,0.6)"
                  stroke="rgba(255,255,255,0.1)"
                />
                <text
                  x="640"
                  y="240"
                  fill="rgba(255,255,255,0.6)"
                  fontFamily="Inter, system-ui"
                  fontSize="16"
                  style={{ letterSpacing: "0.08em" }}
                >
                  TOKENS
                </text>
                <text
                  x="640"
                  y="305"
                  fill="#E6EAF2"
                  fontFamily="Inter, system-ui"
                  fontSize="44"
                  fontWeight="800"
                >
                  {`${formatQty(tokens, 2)} $BLNS`}
                </text>
              </g>

              {/* Tagline pill */}
              <g>
                <rect
                  x="60"
                  y="440"
                  rx="14"
                  ry="14"
                  width="520"
                  height="70"
                  fill="rgba(18,25,34,0.6)"
                  stroke="#FF7A29"
                  strokeOpacity="0.4"
                />
                <text
                  x="90"
                  y="485"
                  fill="#FF7A29"
                  fontFamily="Inter, system-ui"
                  fontSize="26"
                  fontWeight="700"
                >
                  {tagline}
                </text>
              </g>

              {/* Footer */}
              <text
                x="60"
                y="585"
                fill="rgba(255,255,255,0.6)"
                fontFamily="Inter, system-ui"
                fontSize="18"
              >
                Powered by @valordefi
              </text>
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-white/80 ring-1 ring-white/15 hover:bg-white/5"
            >
              Close
            </button>
            <NeonButton onClick={downloadPNG}>Download PNG</NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ——— Local UI bits ——— */

function GlassPanel({ children, highlight }) {
  const neon =
    highlight === "orange"
      ? "0 0 0 1px rgba(255,122,41,0.18), 0 0 40px 2px rgba(255,122,41,0.12)"
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

function EligibilityPill({ eligible, bestRank }) {
  return (
    <span
      className={
        "rounded-full px-2 py-1 text-[11px] ring-1 backdrop-blur " +
        (eligible
          ? "bg-[#22C55E]/10 text-[#22C55E] ring-white/10"
          : "bg-white/5 text-white/70 ring-white/10")
      }
    >
      {eligible
        ? bestRank
          ? `Eligible (best rank #${bestRank})`
          : "Eligible"
        : "Not eligible"}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl ring-1 ring-white/10 bg-white/5 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wider text-white/60">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function NeonButton({ children, className = "", ...props }) {
  const disabled = props.disabled;
  return (
    <button
      {...props}
      className={
        "relative inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-medium tracking-wide transition-transform will-change-transform " +
        (disabled
          ? "bg-[#FF7A29] text-black cursor-not-allowed "
          : "bg-[#FF7A29] text-black hover:scale-[1.02] active:scale-[0.99] ") +
        "shadow-[0_0_24px_rgba(255,122,41,0.5)] " +
        className
      }
      style={{ textShadow: "0 0 10px rgba(0,0,0,0.25)" }}
    >
      {children}
    </button>
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

// $X.XXB for ≥1B, $XXX.XXM for ≥1M, else $X,XXX
function formatFDV(n) {
  if (n == null || isNaN(n)) return "–";
  if (n >= 1_000_000_000)
    return `$${(n / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}B`;
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// plain number for tokens
function formatQty(n, maxDigits = 2) {
  if (n == null || isNaN(n)) return "–";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}

// price with $ and up to 6 decimals
function formatPrice(n, maxDigits = 6) {
  if (n == null || isNaN(n)) return "–";
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: maxDigits,
  })}`;
}

// USD with $ and 2 decimals by default
function formatMoney(n, maxDigits = 2) {
  if (n == null || isNaN(n)) return "–";
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: maxDigits,
  })}`;
}
