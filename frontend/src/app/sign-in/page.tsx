"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const DarkVeil = dynamic(() => import("@/components/ui/DarkVeil"), {
    ssr: false,
});

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (isSignUp) {
                await authClient.signUp.email(
                    { email, password, name, callbackURL: "/dashboard" },
                    {
                        onSuccess: () => router.push("/dashboard"),
                        onError: (ctx) => alert(ctx.error.message),
                    }
                );
            } else {
                await authClient.signIn.email(
                    { email, password, callbackURL: "/dashboard" },
                    {
                        onSuccess: () => router.push("/dashboard"),
                        onError: (ctx) => alert(ctx.error.message),
                    }
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
            });
        } catch (error) {
            console.error("Google sign-in error:", error);
            alert("Failed to sign in with Google");
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex h-screen items-center justify-center bg-[#050505] overflow-hidden">
            {/* DarkVeil Background */}
            <div className="absolute inset-0 z-0 opacity-50">
                <DarkVeil
                    hueShift={220}
                    noiseIntensity={0.03}
                    scanlineIntensity={0}
                    speed={0.3}
                    scanlineFrequency={0}
                    warpAmount={0.3}
                    resolutionScale={0.5}
                />
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />

            {/* Auth Card */}
            <div className="relative z-10 w-full max-w-sm mx-4">
                <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">
                            Pinnacle
                        </span>
                    </div>

                    <h1 className="text-xl font-semibold text-center mb-1 font-[family-name:var(--font-space-grotesk)]">
                        {isSignUp ? "Create Account" : "Welcome back"}
                    </h1>
                    <p className="text-sm text-white/40 text-center mb-6">
                        {isSignUp
                            ? "Start building with Pinnacle"
                            : "Sign in to your account"}
                    </p>

                    {/* Google Sign-In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50 transition-all mb-5"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/30">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Form */}
                    <div className="space-y-3">
                        {isSignUp && (
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full mt-5 py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 disabled:opacity-50 transition-all"
                    >
                        {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                    </button>

                    <p className="mt-5 text-center text-xs text-white/40">
                        {isSignUp ? "Already have an account?" : "No account?"}{" "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                        >
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
