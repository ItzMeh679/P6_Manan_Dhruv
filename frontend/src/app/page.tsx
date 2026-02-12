import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

// SVG Icon Components
const TerminalIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const LockIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CodeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const DevicesIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ApiIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DatabaseIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const LayersIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const BoltIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const ShareIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const JavaScriptIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.405-.6-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" />
  </svg>
);

const PythonIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.31.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.83l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.23l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.24l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05 1.07.13zm-6.3 1.09l-.32.03-.29.08-.25.12-.2.15-.15.18-.1.19-.05.18-.02.15.02.13.05.12.09.1.12.08.14.06.16.03.14.01h.08l.15-.01.14-.03.13-.05.1-.07.08-.09.06-.1.04-.11.02-.12v-.11l-.02-.1-.04-.09-.07-.08-.08-.06-.1-.05-.12-.03-.13-.02zM21.79 17c-.02.21-.06.44-.13.67-.07.23-.17.47-.31.7-.14.24-.32.47-.54.69-.22.22-.49.42-.81.6-.32.18-.69.34-1.11.47-.42.13-.9.23-1.43.3l-1.4.05-.9-.03-.81-.09-.72-.14-.63-.18-.55-.22-.46-.27-.38-.3-.31-.33-.24-.35-.18-.36-.13-.35-.08-.33-.04-.28-.01-.21L13 14.7h2.05v.51l.04.38.11.35.17.31.23.26.3.22.36.17.41.12.45.07.48.02h.47l.46-.05.44-.11.4-.16.35-.21.28-.26.22-.29.15-.31.08-.32.02-.24-.02-.22-.07-.21-.12-.2-.17-.18-.22-.16-.27-.14-.32-.12-.35-.1-.38-.08-.41-.07-.44-.05-.46-.04-.48-.02h-.44l-.51.02-.53.05-.53.09-.52.13-.5.17-.47.2-.43.24-.38.27-.33.3-.27.32-.21.33-.16.33-.11.32-.06.3-.02.27.05.97.16.76.24.57.32.43.39.32.44.24.49.18.52.14.54.1.55.08.55.05.55.03.53.01.51-.01.49-.03.47-.05.44-.07.41-.09.38-.11.34-.12.31-.14.27-.16.24-.17.2-.19.17-.2.14-.21.12-.22.09-.22.07-.23.05-.23.03-.23.02-.23v-.22l-.01-.21-.03-.2-.05-.19z" />
  </svg>
);

const FastAPIIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.375 0 0 5.375 0 12c0 6.627 5.375 12 12 12 6.626 0 12-5.373 12-12 0-6.625-5.373-12-12-12zm-.624 21.62v-7.528H7.19L13.203 2.38v7.528h4.029L11.376 21.62z" />
  </svg>
);

const PostgreSQLIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.128 0a10.134 10.134 0 0 0-2.755.403l-.063.02A10.922 10.922 0 0 0 12.6.258C11.422.238 10.41.524 9.594 1 8.79.721 7.122.24 5.364.336 4.14.403 2.804.775 1.814 1.82.827 2.865.305 4.482.415 6.682c.03.607.203 1.597.49 2.879s.69 2.783 1.193 4.152c.503 1.37 1.054 2.6 1.915 3.436.43.419 1.022.771 1.72.742.49-.02.933-.235 1.315-.552.186.245.385.352.566.451.228.125.45.21.68.266.413.103 1.12.241 1.948.1.282-.047.579-.128.88-.27.012.676.024 1.275.03 1.71.008.541.013 1.097-.075 1.74-.084.616-.232 1.123-.474 1.564-.24.438-.519.72-.893.87-.375.148-.87.2-1.585.15a.5.5 0 0 0-.069.997c.813.058 1.507-.01 2.096-.242.594-.234 1.065-.649 1.418-1.293.348-.637.525-1.262.62-1.956.097-.712.086-1.34.078-1.917l-.005-.335c-.004-.59-.01-1.33-.025-2.213l.02-.197.018-.158c.31.024.628.027.956.003a5.37 5.37 0 0 0 1.106-.187 4.12 4.12 0 0 0 .439-.145c.053.14.11.28.17.42.22.51.461 1.053.67 1.41.21.36.453.744.823 1.025.37.28.866.433 1.412.337.546-.095.99-.417 1.287-.756.296-.34.502-.712.66-1.04.32-.665.514-1.254.657-1.721.142-.47.242-.85.33-1.267.056-.269.073-.562-.057-.844a.959.959 0 0 0-.561-.493c.088-.247.167-.49.237-.727.26-.872.42-1.684.42-2.382 0-.525-.063-1.006-.165-1.453a6.26 6.26 0 0 0 .3-1.588c.07-.65.063-1.313-.014-1.965a6.155 6.155 0 0 0-.404-1.57c-.237-.558-.591-1.091-1.126-1.494a3.81 3.81 0 0 0-1.872-.748 8.574 8.574 0 0 0-1.936-.025z" />
  </svg>
);

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="bg-white min-h-screen flex flex-col antialiased text-[#111827]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-white/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded bg-[#137fec] text-white shadow-sm">
                <TerminalIcon className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#111827]">Pinnacle</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a className="text-sm font-medium text-[#4b5563] hover:text-[#137fec] transition-colors" href="#">Docs</a>
              <a className="text-sm font-medium text-[#4b5563] hover:text-[#137fec] transition-colors" href="#">Pricing</a>
              {session ? (
                <Link
                  href="/dashboard"
                  className="flex h-9 items-center justify-center rounded-lg bg-[#137fec] px-4 text-sm font-bold text-white hover:bg-[#137fec]/90 transition-colors shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link className="text-sm font-medium text-[#4b5563] hover:text-[#137fec] transition-colors" href="/sign-in">Sign In</Link>
                  <Link
                    href="/sign-in"
                    className="flex h-9 items-center justify-center rounded-lg bg-[#137fec] px-4 text-sm font-bold text-white hover:bg-[#137fec]/90 transition-colors shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
            <div className="flex md:hidden">
              <button className="text-gray-500 hover:text-[#137fec]">
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-white">
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#111827 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="flex flex-col gap-6 text-center lg:text-left">
              <div className="inline-flex w-fit mx-auto lg:mx-0 items-center rounded-full border border-[#137fec]/20 bg-[#137fec]/5 px-3 py-1 text-xs font-medium text-[#137fec] shadow-sm">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#137fec] animate-pulse"></span>
                v2.0 is now live
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-gray-900">
                Ship Full-Stack Python &amp; React Apps <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#137fec] to-blue-600">Faster</span>.
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-body">
                Production-ready boilerplate for Next.js, FastAPI, and PostgreSQL. Dockerized, type-safe, and ready to deploy in minutes, not days.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="flex h-12 items-center justify-center rounded-lg bg-[#137fec] px-6 text-base font-bold text-white hover:bg-[#137fec]/90 transition-all shadow-lg shadow-[#137fec]/25 hover:shadow-xl hover:shadow-[#137fec]/30 hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="flex h-12 items-center justify-center rounded-lg bg-[#137fec] px-6 text-base font-bold text-white hover:bg-[#137fec]/90 transition-all shadow-lg shadow-[#137fec]/25 hover:shadow-xl hover:shadow-[#137fec]/30 hover:-translate-y-0.5"
                    >
                      Deploy Now
                    </Link>
                    <button className="flex h-12 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 px-6 text-base font-bold text-gray-700 transition-all shadow-sm">
                      <CodeIcon className="w-5 h-5 mr-2 text-gray-500" />
                      View GitHub
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#137fec] to-blue-600 opacity-10 blur-2xl"></div>
              <div className="relative rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50 overflow-hidden aspect-[4/3] flex flex-col group">
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400 border border-red-500/10"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400 border border-yellow-500/10"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400 border border-green-500/10"></div>
                  </div>
                  <div className="mx-auto flex items-center gap-1 rounded bg-white px-3 py-0.5 border border-gray-200 shadow-sm">
                    <LockIcon className="w-3 h-3 text-gray-400" />
                    <div className="text-xs font-mono text-gray-500">localhost:3000</div>
                  </div>
                </div>
                <div
                  className="flex-1 w-full bg-cover bg-center bg-gray-900"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC49UrKlnqyPxizkW-7Fwq-hgg9Dq26JFk6vqO3USjxDYblSrKi_vvOU0-5vhhNanmiNbb225Kk3L_sfg6ku8FR7MfkuPtcsupbhloKyQbgSrnHJyT-Ye45keCMZzhwb6q_b_QxYquWirzjAz9dTb5GSVLyi3wgiCWVmqVYLVsMnDLRBVJ8Nq_uxF63lIODO8kywvmqz8K-FXWgrwcszpq3TlWpJhjkET15-zDFlhYfQbstXqHPR9N0z7VG8NSs7XDM4t7KRRfsh3Y7')" }}
                >
                  <div className="absolute inset-0 bg-[#137fec]/5 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="border-y border-gray-200 bg-[#f3f4f6]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-gray-500 mb-10">Powered by modern standards</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 items-center">
            <div className="flex items-center gap-2 group cursor-default transition-all duration-300 opacity-60 hover:opacity-100 grayscale hover:grayscale-0">
              <JavaScriptIcon className="w-9 h-9 text-gray-800 group-hover:text-black transition-colors" />
              <span className="text-xl font-bold text-gray-700 group-hover:text-black">Next.js</span>
            </div>
            <div className="flex items-center gap-2 group cursor-default transition-all duration-300 opacity-60 hover:opacity-100 grayscale hover:grayscale-0">
              <PythonIcon className="w-9 h-9 text-gray-800 group-hover:text-[#3776AB] transition-colors" />
              <span className="text-xl font-bold text-gray-700 group-hover:text-[#3776AB]">Python</span>
            </div>
            <div className="flex items-center gap-2 group cursor-default transition-all duration-300 opacity-60 hover:opacity-100 grayscale hover:grayscale-0">
              <FastAPIIcon className="w-9 h-9 text-gray-800 group-hover:text-[#009688] transition-colors" />
              <span className="text-xl font-bold text-gray-700 group-hover:text-[#009688]">FastAPI</span>
            </div>
            <div className="flex items-center gap-2 group cursor-default transition-all duration-300 opacity-60 hover:opacity-100 grayscale hover:grayscale-0">
              <PostgreSQLIcon className="w-9 h-9 text-gray-800 group-hover:text-[#336791] transition-colors" />
              <span className="text-xl font-bold text-gray-700 group-hover:text-[#336791]">PostgreSQL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Architecture &amp; Data Flow</h2>
            <p className="mt-4 text-lg text-gray-600">A robust, type-safe data pipeline from client to persistence.</p>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 hidden w-full -translate-y-1/2 transform border-t-2 border-dashed border-gray-200 lg:block z-0"></div>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              <div className="group relative flex flex-col items-center gap-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#137fec]/30 group-hover:shadow-lg group-hover:shadow-[#137fec]/5">
                  <DevicesIcon className="w-10 h-10 text-gray-400 group-hover:text-[#137fec] transition-colors" />
                </div>
                <div className="bg-white px-2">
                  <h3 className="text-lg font-bold text-gray-900">Next.js Client</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed font-body">SSR React pages with React Query for data fetching.</p>
                </div>
              </div>
              <div className="group relative flex flex-col items-center gap-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#137fec]/30 group-hover:shadow-lg group-hover:shadow-[#137fec]/5">
                  <ApiIcon className="w-10 h-10 text-gray-400 group-hover:text-[#137fec] transition-colors" />
                </div>
                <div className="bg-white px-2">
                  <h3 className="text-lg font-bold text-gray-900">FastAPI Gateway</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed font-body">Async endpoints with Pydantic validation &amp; Auto-docs.</p>
                </div>
              </div>
              <div className="group relative flex flex-col items-center gap-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#137fec]/30 group-hover:shadow-lg group-hover:shadow-[#137fec]/5">
                  <DatabaseIcon className="w-10 h-10 text-gray-400 group-hover:text-[#137fec] transition-colors" />
                </div>
                <div className="bg-white px-2">
                  <h3 className="text-lg font-bold text-gray-900">PostgreSQL</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed font-body">Relational persistence with Alembic migrations.</p>
                </div>
              </div>
              <div className="group relative flex flex-col items-center gap-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#137fec]/30 group-hover:shadow-lg group-hover:shadow-[#137fec]/5">
                  <LayersIcon className="w-10 h-10 text-gray-400 group-hover:text-[#137fec] transition-colors" />
                </div>
                <div className="bg-white px-2">
                  <h3 className="text-lg font-bold text-gray-900">Docker Compose</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed font-body">Orchestrate the entire stack with a single command.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal / Quick Start Section */}
      <section className="py-24 bg-[#f3f4f6] border-t border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden bg-[#1e293b] border border-[#334155] shadow-2xl shadow-gray-300">
                <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-[#334155]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                  </div>
                  <div className="text-xs font-mono text-gray-400">bash — 80x24</div>
                  <div className="w-8"></div>
                </div>
                <div className="p-6 font-mono text-sm sm:text-base overflow-x-auto terminal-scroll h-[300px]">
                  <div className="flex flex-col gap-3">
                    <div className="flex text-gray-300">
                      <span className="text-[#137fec] mr-3 select-none">$</span>
                      <span>git clone https://github.com/pinnacle/template.git</span>
                    </div>
                    <div className="text-gray-500 italic text-xs">Cloning into &apos;pinnacle&apos;...</div>
                    <div className="flex text-gray-300">
                      <span className="text-[#137fec] mr-3 select-none">$</span>
                      <span>cd pinnacle</span>
                    </div>
                    <div className="flex text-gray-300">
                      <span className="text-[#137fec] mr-3 select-none">$</span>
                      <span className="border-r-2 border-gray-400 pr-1 animate-pulse">make up</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex mb-4 items-center rounded-md bg-white border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 shadow-sm">
                <BoltIcon className="w-4 h-4 mr-1 text-[#137fec]" />
                Ready in minutes
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Spin it up in seconds.</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-body">
                Don&apos;t waste weeks setting up authentication, database connections, and types. We&apos;ve done the heavy lifting so you can focus on building features.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircleIcon className="w-6 h-6 text-[#137fec]" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold">Local Development Optimized</h3>
                    <p className="text-sm text-gray-600 mt-1 font-body">Hot-reloading for both frontend and backend inside containers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircleIcon className="w-6 h-6 text-[#137fec]" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold">Secure by Default</h3>
                    <p className="text-sm text-gray-600 mt-1 font-body">JWT authentication, password hashing, and CORS pre-configured.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircleIcon className="w-6 h-6 text-[#137fec]" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold">Type-Safe Everywhere</h3>
                    <p className="text-sm text-gray-600 mt-1 font-body">End-to-end type safety from your SQL schema to your React props.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-gray-900 mb-4">
                <TerminalIcon className="w-5 h-5 text-[#137fec]" />
                <span className="font-bold">Pinnacle</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed pr-4 font-body">
                The modern full-stack boilerplate for ambitious developers. Built with care for the open source community.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Features</a></li>
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Documentation</a></li>
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">GitHub Repo</a></li>
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Discord Community</a></li>
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Privacy</a></li>
                <li><a className="text-sm text-gray-500 hover:text-[#137fec] transition-colors" href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2024 Pinnacle. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="text-gray-400 hover:text-gray-600 transition-colors" href="#">
                <span className="sr-only">GitHub</span>
                <CodeIcon className="w-5 h-5" />
              </a>
              <a className="text-gray-400 hover:text-gray-600 transition-colors" href="#">
                <span className="sr-only">Twitter</span>
                <ShareIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
