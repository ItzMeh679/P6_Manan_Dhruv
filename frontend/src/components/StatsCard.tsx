import { ParticleCard } from '@/components/ui/MagicBento';

interface StatsCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string | number;
}

export default function StatsCard({ icon, iconBg, label, value }: StatsCardProps) {
    return (
        <ParticleCard enableMagnetism={false} enableTilt={true} glowColor="255, 255, 255" className="card--border-glow bg-black/40 backdrop-blur-[20px] rounded-xl border border-white/5 h-full">
            <div className="p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors h-full rounded-xl relative z-10">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="text-xl font-bold text-white mt-0.5">{value}</p>
                </div>
            </div>
        </ParticleCard>
    );
}
