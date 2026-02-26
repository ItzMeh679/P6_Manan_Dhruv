"use client";

interface TopNavProps {
    userName: string;
    userEmail?: string;
    userImage?: string | null;
    organizationName?: string;
    onSignOut: () => void;
}

export default function TopNav({ userName, userEmail, userImage, organizationName = "Personal", onSignOut }: TopNavProps) {
    const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <header className="h-14 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-end px-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="font-medium text-white text-sm">{userName}</p>
                    <p className="text-white/30 text-xs">{organizationName}</p>
                </div>
                {userImage ? (
                    <img src={userImage} alt={userName} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-medium text-xs">
                        {initials}
                    </div>
                )}
            </div>
            <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-xs font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
            </button>
        </header>
    );
}
