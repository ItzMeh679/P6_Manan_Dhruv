interface StatsCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string | number;
}

export default function StatsCard({ icon, iconBg, label, value }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}
            >
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
