"use client";

interface TopNavProps {
    userName: string;
    userEmail?: string;
    userImage?: string | null;
    organizationName?: string;
    onSignOut: () => void;
}

export default function TopNav({
    userName,
    userEmail,
    userImage,
    organizationName = "Acme Corp",
    onSignOut,
}: TopNavProps) {
    // Get initials from name
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="font-medium text-gray-900 text-sm">{userName}</p>
                    <p className="text-gray-500 text-xs">{organizationName}</p>
                </div>
                {userImage ? (
                    <img
                        src={userImage}
                        alt={userName}
                        className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-white font-medium text-sm">
                        {initials}
                    </div>
                )}
            </div>

            {/* Sign Out Button */}
            <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
            </button>
        </header>
    );
}
