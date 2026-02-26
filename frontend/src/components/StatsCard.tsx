import { ParticleCard } from '@/components/ui/MagicBento';

interface StatsCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string | number;
}

export default function StatsCard({ icon, iconBg, label, value }: StatsCardProps) {
    return (
        <ParticleCard enableMagnetism={false} enableTilt={true} glowColor="255, 255, 255" className="card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)] h-full">
            <div className="p-5 flex items-center gap-4 hover:bg-[var(--hover-bg)] transition-colors h-full rounded-xl relative z-10">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[var(--text-subtle)] text-xs font-medium uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="text-xl font-bold text-[var(--text-main)] mt-0.5">{value}</p>
                </div>
            </div>
        </ParticleCard>
    );
}
