import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  PawPrint,
  MapPin,
  Map,
  FileText,
  Settings,
  Compass,
  MessageSquare,
  CreditCard,
  CheckCircle,
  BarChart3,
  Target,
  User,
  Pin,
  Star,
  IdCard,
  AlertTriangle,
  Share2,
  Bell,
  Globe,
  PlayCircle,
  Smartphone,
  ShieldCheck
} from "lucide-react";
import "./Home.css";

/* ── REVEAL HOOK ───────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── NAV ───────────────────────────────────── */
const NAV_SECTION_IDS = {
  "For Drivers": "drivers",
  "For Passengers": "passengers",
  "Safety": "safety",
  "How it works": "how-it-works",
};

function Nav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("via-user") || "null");
    } catch (error) {
      console.error("Failed to parse saved user", error);
      return null;
    }
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const links = ["For Drivers", "For Passengers", "Safety", "How it works"];

  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <span className="logo-pill">VP</span>
          ViaPool
        </a>
        <ul className="nav-links">
          {links.map(l => (
            <li key={l}>
              <a href={`#${NAV_SECTION_IDS[l]}`}
                onClick={e => { e.preventDefault(); scrollTo(NAV_SECTION_IDS[l]); }}
              >{l}</a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          {user ? (
            <button className="btn-fill" onClick={() => navigate(user.role === 'driver' ? '/driver/dashboard' : '/search')}>Go to Dashboard</button>
          ) : (
            <>
              <button className="btn-outline" onClick={() => navigate("/login")}>Log in</button>
              <button className="btn-fill" onClick={() => navigate("/register")}>Get started</button>
            </>
          )}
        </div>
        <button
          className={`nav-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile full-screen drawer */}
      <div className={`nav-mobile ${menuOpen ? "open" : ""}`}>
        {links.map(l => (
          <a key={l} href={`#${NAV_SECTION_IDS[l]}`}
            onClick={e => { e.preventDefault(); scrollTo(NAV_SECTION_IDS[l]); }}
          >{l}</a>
        ))}
        <div className="nav-mobile-actions">
          {user ? (
            <button className="btn-fill" onClick={() => { setMenuOpen(false); navigate(user.role === 'driver' ? '/driver/dashboard' : '/search'); }}>Go to Dashboard</button>
          ) : (
            <>
              <button className="btn-outline" onClick={() => { setMenuOpen(false); navigate("/login"); }}>Log in</button>
              <button className="btn-fill" onClick={() => { setMenuOpen(false); navigate("/register"); }}>Get started</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── HERO ───────────────────────────────────── */
const STATS = [
  { num: "2M+", lbl: "Trips completed" },
  { num: "98%", lbl: "Safety score" },
  { num: "4.9", lbl: "Avg rating", icon: Star },
];

const CHIPS = [
  { pos: { top: "-20px", right: "32px" }, text: "Pets welcome", icon: PawPrint },
  { pos: { bottom: "56px", left: "-28px" }, text: "Live tracking", icon: MapPin },
];

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero" id="hero">
      <div className="road-stripe" />
      <div className="road-stripe-inner" />
      <svg className="route-svg" viewBox="0 0 1200 700" preserveAspectRatio="none">
        <path
          d="M -50 650 Q 200 400 400 300 Q 600 200 900 180 Q 1050 170 1300 120"
          fill="none" stroke="#C4622D" strokeWidth="2"
          strokeDasharray="12 8" opacity="0.25"
        />
        <circle cx="120" cy="580" r="6" fill="#C4622D" opacity="0.5" />
        <circle cx="1050" cy="160" r="6" fill="#C9A84C" opacity="0.5" />
      </svg>

      <div className="hero-content">
        {/* Left */}
        <div className="hero-left">
          <div style={{ animation: "fadeUp 0.7s both" }}>
            <div className="hero-eyebrow">
              <span className="blink-dot" />
              Live in 40+ cities
            </div>
          </div>

          <h1 className="hero-h1" style={{ animation: "fadeUp 0.7s 0.1s both" }}>
            Share the road,<br /><em>own the journey.</em>
          </h1>

          <p className="hero-sub" style={{ animation: "fadeUp 0.7s 0.18s both" }}>
            ViaPool matches drivers and passengers on the same route — turning daily commutes into shared savings, fewer cars, and better connections.
          </p>

          <div className="hero-actions" style={{ animation: "fadeUp 0.7s 0.26s both" }}>
            <button className="btn-primary" onClick={() => navigate("/driver/setup")}>Offer a Ride →</button>
            <button className="btn-secondary" onClick={() => navigate("/search")}>Find a Ride</button>
          </div>

          <div className="hero-stats" style={{ animation: "fadeUp 0.7s 0.34s both" }}>
            {STATS.map((s, i) => (
              <Fragment key={s.num}>
                {i > 0 && <div className="hs-div" />}
                <div className="hs-item">
                  <div className="hs-num">
                    {s.num}
                    {s.icon && <s.icon size={16} fill="var(--gold)" color="var(--gold)" style={{ marginLeft: 4 }} />}
                  </div>
                  <div className="hs-lbl">{s.lbl}</div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>

        {/* Right — card */}
        <div className="hero-right" style={{ animation: "fadeUp 0.7s 0.2s both" }}>
          <div className="hero-card-main">
            <div className="hcm-noise" />
            <div className="hcm-tag">Live match found</div>

            <div className="hcm-route">
              <div className="route-point">
                <div className="rp-dot origin" />
                <div>
                  <div className="rp-label">Pickup</div>
                  <div className="rp-value">Hitech City, Hyderabad</div>
                </div>
              </div>
              <div className="rp-line" />
              <div className="route-point">
                <div className="rp-dot dest" />
                <div>
                  <div className="rp-label">Drop-off</div>
                  <div className="rp-value">Banjara Hills, Hyd</div>
                </div>
              </div>
            </div>

            <hr className="hcm-sep" />

            <div className="hcm-driver">
              <div className="driver-av">A</div>
              <div className="driver-info">
                <div className="di-name">Arjun Sharma</div>
                <div className="di-sub">
                  Honda City · <Star size={10} fill="var(--gold)" color="var(--gold)" style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 2 }} /> 4.9 · 2 seats left
                </div>
              </div>
              <div className="driver-fare">
                <div className="df-amt">₹240</div>
                <div className="df-lbl">per seat</div>
              </div>
            </div>

            <div className="hcm-bottom">
              {[
                { val: "08:45 AM", lbl: "Departure" },
                { val: "9.4 km", lbl: "Distance" },
                { val: "22 min", lbl: "Est. time" },
              ].map(c => (
                <div className="hcb-chip" key={c.lbl}>
                  <div className="hcb-val">{c.val}</div>
                  <div className="hcb-lbl">{c.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {CHIPS.map(({ pos, text, icon: Icon }) => (
            <div className="float-chip" key={text} style={pos}>
              <Icon size={14} style={{ marginRight: 6, opacity: 0.8 }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── MARQUEE ────────────────────────────────── */
const MARQUEE_ITEMS = [
  "Smart Routing", "Verified Drivers", "In-app Payments", "Two-way Ratings",
  "SOS Safety", "Real-time Tracking", "Instant Matching", "Pet-friendly Rides",
  "Zero Surge Pricing", "Eco Commuting",
];

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <div className="marquee-item" key={i}>
            {item}<span className="marquee-dot">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── DRIVER SECTION ─────────────────────────── */
const BENTO_CARDS = [
  {
    cls: "bc-1", icon: Map, title: "Post Your Route",
    desc: "Set start, destination, time, seats, and price. Your listing goes live instantly.",
    tags: [["Start & End"], ["Time"], ["Seats"], ["Price"]]
  },
  {
    cls: "bc-2", icon: FileText, title: "Document Verification",
    desc: "Upload your license and RC once. Get the verified badge and earn passenger trust.",
    tags: [["License", "dark"], ["RC", "dark"], ["Vehicle docs", "dark"]]
  },
  {
    cls: "bc-3", icon: Settings, title: "Your Preferences",
    desc: "Allow pets, set gender filters, and define exactly who rides with you.", tags: []
  },
  {
    cls: "bc-4", icon: Compass, title: "Navigation & Passenger Panel",
    desc: "Turn-by-turn routing with a live sidebar. Accept or reject with a tap.",
    tags: [["Live map"], ["Accept / Reject"]]
  },
  {
    cls: "bc-5", icon: MessageSquare, title: "In-app Chat",
    desc: "Message each passenger directly inside ViaPool — no number sharing needed.", tags: []
  },
  {
    cls: "bc-6", icon: CreditCard, title: "Payment Tracking",
    desc: "See payment status per passenger. Mark as paid or collect in-app.", tags: []
  },
  {
    cls: "bc-7", icon: CheckCircle, title: "Accept or Reject",
    desc: "Full control over who joins. Review profiles and ratings before confirming.", tags: []
  },
  {
    cls: "bc-8", icon: BarChart3, title: "Trip Analytics",
    desc: "After every ride, review average speed, stops, distance, and total earnings.", tags: []
  },
];

function DriverSection() {
  return (
    <section className="section-wrap" id="drivers">
      <Reveal>
        <span className="chip chip-terra" style={{ marginBottom: 20, display: "inline-flex" }}>For Drivers</span>
        <h2 className="display-h2" style={{ marginBottom: 18 }}>Your commute,<br /><em>your earnings.</em></h2>
        <p className="body-lead" style={{ maxWidth: 480 }}>Post your route, set your preferences, and let ViaPool fill your empty seats — effortlessly.</p>
      </Reveal>
      <Reveal delay={120}>
        <div className="bento">
          {BENTO_CARDS.map(card => (
            <div className={`bc ${card.cls}`} key={card.cls}>
              <div className="bc-icon"><card.icon size={24} /></div>
              <div className="bc-title">{card.title}</div>
              <div className="bc-desc">{card.desc}</div>
              {card.tags.length > 0 && (
                <div className="bc-tags">
                  {card.tags.map(([label, variant]) => (
                    <span className={`bc-tag ${variant || ""}`} key={label}>{label}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── PASSENGER SECTION ──────────────────────── */
const PASS_ITEMS = [
  { n: "01", t: "Book a Ride", d: "Enter your current location and destination. Matched drivers appear in seconds." },
  { n: "02", t: "View Driver Profile", d: "Full profile with verified badge, car info, ratings, and past reviews." },
  { n: "03", t: "Smart Preferences", d: "Filter by experience, car type, and budget. Sort by lowest fare or highest rating." },
  { n: "04", t: "Real-time Tracking", d: "Watch your driver's live location on the map. Know exactly when they arrive." },
  { n: "05", t: "Secure Payment & Cancellation", d: "Pay safely in-app. Cancel anytime before pickup with transparent policies." },
  { n: "06", t: "Chat with Driver", d: "Message drivers directly inside ViaPool. No need to share your number." },
];

const SAMPLE_DRIVERS = [
  { name: "Rahul S.", sub: "Sedan · 5 yrs · ★4.9 · 2 seats", price: "₹220", color: "#C4622D", letter: "R" },
  { name: "Sneha R.", sub: "SUV · 3 yrs · ★4.8 · 3 seats", price: "₹260", color: "#2D4A35", letter: "S" },
  { name: "Dev M.", sub: "Hatchback · ★4.7 · 1 seat", price: "₹190", color: "#C9A84C", letter: "D" },
];

function PassengerSection() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Sedan");

  return (
    <section className="pass-section" id="passengers">
      <div className="pass-inner">
        <div className="pass-left">
          <Reveal>
            <span className="chip chip-cream" style={{ marginBottom: 20, display: "inline-flex" }}>For Passengers</span>
            <h2 className="display-h2" style={{ marginBottom: 18 }}>Find your ride,<br /><em>your way.</em></h2>
            <p className="body-lead">Filter by car type, driver rating, and price. Track in real-time. Arrive with confidence.</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="pass-list">
              {PASS_ITEMS.map(item => (
                <div className="pl-item" key={item.n}>
                  <div className="pl-num">{item.n}</div>
                  <div>
                    <div className="pl-title">{item.t}</div>
                    <div className="pl-desc">{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <div className="ride-widget">
            <div className="rw-title">Find a ride now</div>
            <div className="rw-input-wrap">
              <MapPin size={16} className="rw-in-icon" />
              <input className="rw-input" placeholder="Your location" defaultValue="Hitech City, Hyderabad" />
            </div>
            <div className="rw-sep">↓</div>
            <div className="rw-input-wrap">
              <Target size={16} className="rw-in-icon" />
              <input className="rw-input" placeholder="Destination" defaultValue="Banjara Hills" />
            </div>
            <div className="rw-filters">
              {["Sedan", "SUV", "Hatchback", "₹ Low", "5★ Only"].map(f => (
                <button
                  key={f}
                  className={`rw-filter ${active === f ? "active" : ""}`}
                  onClick={() => setActive(f)}
                >{f}</button>
              ))}
            </div>
            <div className="rw-drivers">
              {SAMPLE_DRIVERS.map(d => (
                <div className="rw-driver" key={d.name} style={{ cursor: "pointer" }} onClick={() => navigate("/search")}>
                  <div className="rw-av" style={{ background: d.color }}>{d.letter}</div>
                  <div className="rw-dinfo">
                    <div className="rw-dname">{d.name}</div>
                    <div className="rw-dsub">
                      {d.sub.split('·').map((part, idx) => (
                        <Fragment key={idx}>
                          {idx > 0 && " · "}
                          {part.includes("★") ? (
                            <>
                              <Star size={10} fill="var(--gold)" color="var(--gold)" style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 2 }} />
                              {part.replace("★", "")}
                            </>
                          ) : part}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="rw-price">{d.price}</div>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 16, padding: "13px" }}
              onClick={() => navigate("/search")}
            >
              Search Rides →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ───────────────────────────── */
const HOW_STEPS = [
  { n: "01", icon: User, t: "Create Profile", d: "Sign up, verify your ID, and set your preferences as a driver or passenger." },
  { n: "02", icon: Pin, t: "Post or Find", d: "Drivers post their route. Passengers search for trips that match their timing." },
  { n: "03", icon: MessageSquare, t: "Match & Chat", d: "Drivers accept passengers. Both sides coordinate pickup details in-app." },
  { n: "04", icon: Star, t: "Ride & Rate", d: "Track live, ride together, pay securely — then rate each other honestly." },
];

function HowItWorks() {
  return (
    <section className="section-wrap" id="how-it-works">
      <Reveal>
        <span className="chip chip-forest" style={{ marginBottom: 20, display: "inline-flex" }}>How it works</span>
        <h2 className="display-h2" style={{ marginBottom: 0 }}>Four steps to your<br /><em>next shared ride.</em></h2>
      </Reveal>
      <Reveal delay={120}>
        <div className="hiw-grid">
          {HOW_STEPS.map(s => (
            <div className="hiw-step" key={s.n}>
              <div className="hiw-n">{s.n}</div>
              <div className="hiw-icon"><s.icon size={24} /></div>
              <div className="hiw-title">{s.t}</div>
              <div className="hiw-desc">{s.d}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── SAFETY ─────────────────────────────────── */
const SAFETY_CARDS = [
  { i: IdCard, t: "Document Verification", d: "Every driver uploads license and RC. Our team manually approves each one." },
  { i: AlertTriangle, t: "SOS Button", d: "One tap shares your live location with trusted contacts and emergency services." },
  { i: Share2, t: "Live Trip Sharing", d: "Share your trip link with family. They track your full route in real time." },
  { i: Bell, t: "Smart Notifications", d: "Instant alerts for bookings, arrivals, payments, and cancellations." },
];

function Safety() {
  return (
    <section className="safety-section" id="safety">
      <div className="safety-inner">
        <Reveal>
          <span className="chip chip-terra" style={{ marginBottom: 20, display: "inline-flex" }}>Safety</span>
          <h2 className="display-h2" style={{ marginBottom: 18 }}>Built safe<br /><em>at every turn.</em></h2>
          <p className="body-lead" style={{ maxWidth: 480 }}>From document checks to SOS alerts — trust is woven into every feature of ViaPool.</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="safety-grid">
            {SAFETY_CARDS.map(s => (
              <div className="safety-card" key={s.t}>
                <div className="sc-icon"><s.i size={24} /></div>
                <div className="sc-title">{s.t}</div>
                <div className="sc-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── RATINGS ────────────────────────────────── */
const BARS = [
  { s: "5", w: "82%" }, { s: "4", w: "12%" },
  { s: "3", w: "4%" }, { s: "2", w: "1%" },
  { s: "1", w: "1%" },
];

function Ratings() {
  return (
    <section className="section-wrap" id="ratings">
      <Reveal>
        <span className="chip chip-gold" style={{ marginBottom: 20, display: "inline-flex" }}>Ratings & Reviews</span>
        <h2 className="display-h2" style={{ marginBottom: 18 }}>Trust built<br /><em>every ride.</em></h2>
        <p className="body-lead" style={{ maxWidth: 480 }}>Two-way ratings keep the community safe, accountable, and respectful of each other's time.</p>
      </Reveal>
      <Reveal delay={120}>
        <div className="ratings-row">
          <div className="big-score">
            <div className="bs-num">4.9</div>
            <div className="bs-stars">
              {[1, 2, 3, 4, 5].map(n => <Star key={n} size={18} fill="currentColor" />)}
            </div>
            <div className="bs-lbl">240,000+ reviews</div>
          </div>
          <div>
            <div className="bar-list">
              {BARS.map(b => (
                <div className="bar-row" key={b.s}>
                  <span className="bar-star">
                    {b.s}
                    <Star size={8} fill="currentColor" style={{ marginLeft: 2, marginBottom: 1 }} />
                  </span>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: b.w }} /></div>
                  <span className="bar-pct">{b.w}</span>
                </div>
              ))}
            </div>
            <div className="rating-tags">
              {[
                { t: "Verified rides", i: CheckCircle },
                { t: "Moderated", i: ShieldCheck },
                { t: "Two-way rating", i: Star }
              ].map(tag => (
                <span className="rating-tag" key={tag.t}>
                  <tag.i size={12} style={{ marginRight: 6 }} />
                  {tag.t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── CTA ────────────────────────────────────── */
const APP_BTNS = [
  { icon: PlayCircle, sub: "Download on the", name: "App Store" },
  { icon: Smartphone, sub: "Get it on", name: "Google Play" },
  { icon: Globe, sub: "Use on", name: "Web App" },
];

function CTA() {
  const navigate = useNavigate();
  return (
    <section className="cta-wrap" id="download">
      <div className="cta-bg-text" aria-hidden="true">ViaPool</div>
      <Reveal>
        <div className="cta-inner">
          <div>
            <h2 className="cta-h2">Ready to share<br /><em>the road?</em></h2>
            <p className="cta-sub">Join thousands of commuters saving money and reducing traffic — one shared seat at a time.</p>
          </div>
          <div className="cta-buttons">
            {APP_BTNS.map(b => (
              <a
                className="app-btn"
                href="#"
                key={b.name}
                onClick={e => {
                  e.preventDefault();
                  if (b.name === "Web App") navigate("/register");
                }}
              >
                <span className="ab-icon"><b.icon size={20} /></span>
                <div>
                  <div className="ab-sub">{b.sub}</div>
                  <div className="ab-name">{b.name}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── FOOTER ─────────────────────────────────── */
function Footer() {
  return (
    <footer className="home-footer">
      <div className="foot-logo">ViaPool</div>
      <nav className="foot-links">
        {["About", "Privacy", "Terms", "Help", "Contact"].map(l => (
          <a href="#" key={l}>{l}</a>
        ))}
      </nav>
      <div className="foot-copy">© 2026 ViaPool. All rights reserved.</div>
    </footer>
  );
}

/* ── PAGE ───────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <DriverSection />
        <PassengerSection />
        <HowItWorks />
        <Safety />
        <Ratings />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
