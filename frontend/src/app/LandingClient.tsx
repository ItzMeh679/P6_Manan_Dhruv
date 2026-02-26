"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import GooeyNav from "@/components/ui/GooeyNav";
import GlassIcons from "@/components/ui/GlassIcons";
import CardSwap, { Card } from "@/components/ui/CardSwap";

const Threads = dynamic(() => import("@/components/ui/Threads"), { ssr: false });

// Icons for GlassIcons
const NextIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361l4.734 7.171 1.9 2.878.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" />
    </svg>
);
const PythonIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M14.31.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.83l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.23l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.24l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05 1.07.13z" />
    </svg>
);
const FastAPIIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 0C5.375 0 0 5.375 0 12c0 6.627 5.375 12 12 12 6.626 0 12-5.373 12-12 0-6.625-5.373-12-12-12zm-.624 21.62v-7.528H7.19L13.203 2.38v7.528h4.029L11.376 21.62z" />
    </svg>
);
const DockerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186H2.22a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m21.062 1.67c-.228-.398-.677-.636-1.271-.636-.304 0-.578.058-.847.147-.107.035-.248.1-.248.1-.3-.623-.69-.853-1.108-1.04.054-.198.076-.462.076-.69 0-2.024-1.236-3.565-2.964-3.565h-.232c-.625-1.195-1.914-2.005-3.377-2.005a4.019 4.019 0 00-3.32 1.743h-.127c-.694 0-1.342.21-1.87.573a2.82 2.82 0 00-1.036-.196c-1.506 0-2.756 1.203-2.852 2.724C.777 12.18 0 13.338 0 14.654c0 1.694 1.282 3.055 2.915 3.154h.235c.524 1.133 1.637 1.894 2.92 1.894s2.398-.76 2.92-1.894h6.222c.524 1.133 1.637 1.894 2.92 1.894s2.396-.76 2.92-1.894h.235c1.633-.1 2.914-1.46 2.914-3.154a3.2 3.2 0 00-.88-2.218" />
    </svg>
);
const DatabaseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);
const AuthIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
);

const featureItems = [
    { icon: <NextIcon />, color: "white", label: "Next.js 16" },
    { icon: <PythonIcon />, color: "blue", label: "Python" },
    { icon: <FastAPIIcon />, color: "green", label: "FastAPI" },
    { icon: <DatabaseIcon />, color: "purple", label: "PostgreSQL" },
    { icon: <DockerIcon />, color: "cyan", label: "Docker" },
    { icon: <AuthIcon />, color: "indigo", label: "Auth" },
];

const navItems = [
    { label: "Features", href: "#features" },
    { label: "Stack", href: "#stack" },
    { label: "Deploy", href: "#deploy" },
];

interface LandingClientProps {
    isLoggedIn: boolean;
}

export default function LandingClient({ isLoggedIn }: LandingClientProps) {
    return (
        <div className="min-h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">
                            Pinnacle
                        </span>
                    </Link>
                    <div className="hidden md:block">
                        <GooeyNav
                            items={navItems}
                            particleCount={12}
                            particleDistances={[70, 10]}
                            particleR={80}
                            initialActiveIndex={0}
                            animationTime={500}
                            timeVariance={200}
                            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
                            onItemClick={(item) => {
                                const target = document.querySelector(item.href);
                                if (target) {
                                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <Link
                                href="/dashboard"
                                className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/sign-in"
                                    className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-in"
                                    className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center">
                {/* Threads Background */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <Threads
                        color={[1, 1, 1]}
                        amplitude={0.8}
                        distance={0}
                        enableMouseInteraction
                    />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center pt-24">
                    {/* Left: Text Content */}
                    <div className="flex flex-col gap-8 lg:-ml-6">
                        <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
                            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            v2.0 — Production Ready
                        </div>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight font-[family-name:var(--font-space-grotesk)]">
                            Ship apps
                            <br />
                            <span className="text-white/40">not boilerplate.</span>
                        </h1>
                        <p className="text-lg text-white/50 max-w-md leading-relaxed">
                            Production-ready starter with Next.js, FastAPI, and PostgreSQL.
                            Type-safe, Dockerized, deploy in minutes.
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <Link
                                href={isLoggedIn ? "/dashboard" : "/sign-in"}
                                className="px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                            >
                                {isLoggedIn ? "Go to Dashboard" : "Start Building"}
                            </Link>
                            <a href="https://github.com/mananshio/P6_Manan_Dhruv" target="_blank" rel="noopener noreferrer" className="px-7 py-3 rounded-full border border-white/15 text-white/70 font-medium text-sm hover:border-white/30 hover:text-white transition-all text-center inline-block">
                                View on GitHub
                            </a>
                        </div>
                    </div>

                    {/* Right: CardSwap */}
                    <div className="relative h-[500px] hidden lg:block -mt-32">
                        <CardSwap
                            cardDistance={50}
                            verticalDistance={60}
                            delay={4000}
                            pauseOnHover
                            width={380}
                            height={260}
                            easing="elastic"
                        >
                            <Card className="p-8 flex flex-col justify-between">
                                <div className="text-xs text-white/40 font-mono mb-4">
                                    $ make up
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm text-green-400 font-mono">
                                        ✓ Frontend ready on :3000
                                    </div>
                                    <div className="text-sm text-green-400 font-mono">
                                        ✓ Backend ready on :8000
                                    </div>
                                    <div className="text-sm text-green-400 font-mono">
                                        ✓ Database connected
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-8 flex flex-col justify-between">
                                <div className="text-xs text-white/40 font-mono mb-4">
                                    auth.ts
                                </div>
                                <div className="font-mono text-xs text-white/70 space-y-1">
                                    <div>
                                        <span className="text-purple-400">export const</span> auth ={" "}
                                        <span className="text-blue-400">betterAuth</span>({"{"})
                                    </div>
                                    <div className="pl-4">
                                        emailAndPassword:{" "}
                                        <span className="text-green-400">true</span>,
                                    </div>
                                    <div className="pl-4">
                                        socialProviders: {"{ "}
                                        <span className="text-orange-300">google</span> {"}"}
                                    </div>
                                    <div>{"}"})</div>
                                </div>
                            </Card>
                            <Card className="p-8 flex flex-col justify-between">
                                <div className="text-xs text-white/40 font-mono mb-4">
                                    docker-compose.yml
                                </div>
                                <div className="font-mono text-xs text-white/70 space-y-1">
                                    <div>
                                        <span className="text-blue-400">services</span>:
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-green-400">frontend</span>: Next.js 16
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-green-400">backend</span>: FastAPI
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-green-400">db</span>: PostgreSQL 16
                                    </div>
                                </div>
                            </Card>
                        </CardSwap>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] mb-4">
                            Everything you need
                        </h2>
                        <p className="text-white/40 text-lg max-w-md mx-auto">
                            A complete stack, pre-configured and ready for production.
                        </p>
                    </div>

                    {/* GlassIcons */}
                    <div id="stack" className="flex justify-center">
                        <GlassIcons items={featureItems} className="max-w-2xl" />
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
                        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-5">
                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 font-[family-name:var(--font-space-grotesk)]">Hot Reload</h3>
                            <p className="text-white/40 text-sm leading-relaxed">
                                Instant feedback on both frontend and backend inside Docker containers.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-5">
                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 font-[family-name:var(--font-space-grotesk)]">Secure by Default</h3>
                            <p className="text-white/40 text-sm leading-relaxed">
                                JWT auth, password hashing, CORS, and API keys pre-configured out of the box.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-5">
                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 font-[family-name:var(--font-space-grotesk)]">Type-Safe</h3>
                            <p className="text-white/40 text-sm leading-relaxed">
                                End-to-end type safety from your database schema to React components.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Deploy Section */}
            <section id="deploy" className="relative py-32 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] mb-4">
                            Three commands. That&apos;s it.
                        </h2>
                        <p className="text-white/40 text-lg mb-12">
                            Clone, configure, deploy. No more spent on setup.
                        </p>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-left font-mono text-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-3 h-3 rounded-full bg-white/20" />
                                <div className="w-3 h-3 rounded-full bg-white/20" />
                                <div className="w-3 h-3 rounded-full bg-white/20" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex">
                                    <span className="text-white/30 mr-3 select-none">$</span>
                                    <span className="text-white/70">
                                        git clone pinnacle/template.git
                                    </span>
                                </div>
                                <div className="flex">
                                    <span className="text-white/30 mr-3 select-none">$</span>
                                    <span className="text-white/70">cp .env.example .env</span>
                                </div>
                                <div className="flex">
                                    <span className="text-white/30 mr-3 select-none">$</span>
                                    <span className="text-white/70">make up</span>
                                    <span className="ml-1 inline-block w-2 h-4 bg-white/50 animate-pulse" />
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <span className="text-green-400/70">
                                        ✓ All services running — localhost:3000
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-white/40">
                        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-sm">
                            © 2024 Pinnacle. Built for developers.
                        </span>
                    </div>
                    <div className="flex gap-6">
                        <a
                            href="#"
                            className="text-sm text-white/30 hover:text-white/60 transition-colors"
                        >
                            GitHub
                        </a>
                        <a
                            href="#"
                            className="text-sm text-white/30 hover:text-white/60 transition-colors"
                        >
                            Docs
                        </a>
                        <a
                            href="#"
                            className="text-sm text-white/30 hover:text-white/60 transition-colors"
                        >
                            Discord
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
