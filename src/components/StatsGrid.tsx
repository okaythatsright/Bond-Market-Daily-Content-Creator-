import { BondMarketSection } from '../types';
import { ArrowUpRight, ArrowDownRight, Activity, Percent, Ban, SlidersHorizontal, BarChart3 } from 'lucide-react';

interface StatsGridProps {
  sections: BondMarketSection[];
}

export default function StatsGrid({ sections }: StatsGridProps) {
  // Extract key stats dynamically from the state
  const usTreasury = sections.find((s) => s.id === 'us-treasury');
  const corporate = sections.find((s) => s.id === 'corporate');
  const realYield = sections.find((s) => s.id === 'real-yield');
  const durationAgg = sections.find((s) => s.id === 'duration-aggregates');

  const y2 = usTreasury?.data.find((d) => d.label.includes('2-Year'));
  const y10 = usTreasury?.data.find((d) => d.label.includes('10-Year'));
  const corpHighYield = corporate?.data.find((d) => d.label.includes('High Yield'));
  const curveSlope = durationAgg?.data.find((d) => d.label.includes('2s10s'));

  const keyStats = [
    {
      title: 'US Treasury 10-Year',
      value: y10?.value || '4.25%',
      change: y10?.change || '+0.04%',
      trend: y10?.trend || 'up',
      subtitle: 'Global benchmark pricing rate'
    },
    {
      title: 'US Treasury 2-Year',
      value: y2?.value || '4.52%',
      change: y2?.change || '+0.06%',
      trend: y2?.trend || 'up',
      subtitle: 'Interest rate policy sensitive'
    },
    {
      title: 'Yield Curve (2s10s)',
      value: curveSlope?.value || '-27 bps',
      change: curveSlope?.change || '-2 bps',
      trend: curveSlope?.trend || 'down',
      subtitle: 'Inversion magnitude indicator'
    },
    {
      title: 'High Yield Master Index',
      value: corpHighYield?.value || '7.45%',
      change: corpHighYield?.change || '-0.08%',
      trend: corpHighYield?.trend || 'down',
      subtitle: 'Credit risk appetite metric'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid-container">
      {keyStats.map((stat, idx) => {
        const isUp = stat.trend === 'up';
        const isDown = stat.trend === 'down';

        return (
          <div
            key={idx}
            className="bg-[#16181D] p-5 rounded-lg border border-[#1F2937] hover:border-[#374151] transition-all flex flex-col justify-between"
            id={`stat-card-${idx}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#B89C6D]">
                  {stat.title}
                </p>
                <p className="text-2xl font-serif font-bold text-[#F3F4F6] mt-1.5">
                  {stat.value}
                </p>
              </div>

              {/* Trend Badge */}
              <span
                className={`py-1 px-2.5 rounded font-mono text-[10px] font-bold flex items-center ${
                  isUp
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : isDown
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}
              >
                {isUp ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : isDown ? (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                ) : null}
                {stat.change}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-[#9CA3AF]">
              <span className="line-clamp-1">{stat.subtitle}</span>
              <Activity className="h-3.5 w-3.5 text-[#374151] flex-shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
