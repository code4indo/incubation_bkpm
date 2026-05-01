import { TrendingUp, Building2, DollarSign, Clock } from 'lucide-react';

export function StatsSection() {
  const stats = [
    {
      icon: Building2,
      value: '181+',
      label: 'Verified Projects',
      sublabel: 'Total Rp 443.3 Trillion',
      color: 'text-[#1B4D5C]',
      bg: 'bg-[#1B4D5C]/5',
    },
    {
      icon: DollarSign,
      value: '$30B+',
      label: 'FDI Inflows 2024',
      sublabel: 'Indonesia Record High',
      color: 'text-[#C9963B]',
      bg: 'bg-[#C9963B]/5',
    },
    {
      icon: TrendingUp,
      value: '38',
      label: 'Provinces Covered',
      sublabel: 'With Regional Scoring',
      color: 'text-[#1B4D5C]',
      bg: 'bg-[#1B4D5C]/5',
    },
    {
      icon: Clock,
      value: '<14 Days',
      label: 'AI Time-to-Match',
      sublabel: 'vs 45-90 Days Manual',
      color: 'text-[#C9963B]',
      bg: 'bg-[#C9963B]/5',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-8 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-3xl sm:text-4xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </p>
            <p className="text-sm font-medium text-[#1C2A33]">{stat.label}</p>
            <p className="text-xs text-[#6B7B8D] mt-1">{stat.sublabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
