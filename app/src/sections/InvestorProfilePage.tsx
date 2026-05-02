import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRecommendations } from '@/hooks/useRecommendations';
import { formatIdrCompact } from '@/lib/formatters';
import { 
  User, Building2, MapPin, DollarSign, TrendingUp, Calendar, 
  Target, Sparkles, Eye, Bookmark, Share2, MessageSquare, 
  HardHat, BarChart3, Edit3, AlertTriangle
} from 'lucide-react';

export function InvestorProfilePage() {
  const { investor } = useRecommendations();

  // Mock interaction history (in production: from API)
  const interactionHistory = [
    { action: 'Viewed', target: 'Batang Integrated Industrial Zone', date: '5 days ago', type: 'view' },
    { action: 'Saved', target: 'Batang Integrated Industrial Zone', date: '4 days ago', type: 'save' },
    { action: 'Sent Inquiry', target: 'Batang Integrated Industrial Zone', date: '3 days ago', type: 'inquiry' },
    { action: 'Viewed', target: 'Hyperscale Data Center Hub', date: '2 days ago', type: 'view' },
    { action: 'Saved', target: 'Nusantara Smart City', date: '1 day ago', type: 'save' },
    { action: 'Viewed', target: 'HPAL Nickel Processing Facility', date: '12 hours ago', type: 'view' },
  ];

  const riskColor = investor.riskAppetite === 'Aggressive' ? 'text-red-500' : 
                    investor.riskAppetite === 'Moderate' ? 'text-[#C9963B]' : 'text-green-600';

  const horizonColor = investor.investmentHorizon === 'Short' ? 'text-green-600' :
                       investor.investmentHorizon === 'Medium' ? 'text-[#C9963B]' : 'text-[#1B4D5C]';

  return (
    <div className="min-h-screen bg-[#F5F3EF] pt-20 pb-12">
      {/* Header Banner */}
      <div className="bg-[#1B4D5C] py-12 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{investor.name}</h1>
              <p className="text-white/70">Investor ID: {investor.id}</p>
            </div>
            <Badge className="ml-auto bg-[#C9963B] text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Profile Active
            </Badge>
          </div>
          <p className="text-white/80 max-w-2xl">
            This profile drives your AI-powered project recommendations. The more complete your profile, 
            the more accurate your match scores will be.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Investment Preferences */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <Target className="w-5 h-5" /> Investment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sector Preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-[#1B4D5C]" />
                    <span className="font-semibold text-[#1C2A33]">Preferred Sectors</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.sectorPreferences.map(sector => (
                      <Badge key={sector} className="bg-[#1B4D5C] text-white px-3 py-1">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[#6B7B8D] mt-2">
                    Projects in these sectors receive up to 25% match score boost
                  </p>
                </div>

                {/* Ticket Size Range */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-[#1B4D5C]" />
                    <span className="font-semibold text-[#1C2A33]">Investment Ticket Size</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#F5F3EF] rounded-lg">
                    <div className="text-center flex-1">
                      <p className="text-xs text-[#6B7B8D]">Minimum</p>
                      <p className="text-xl font-bold text-[#1B4D5C]">{formatIdrCompact(investor.minTicketSize * 1_000_000_000)}</p>
                    </div>
                    <div className="w-8 h-0.5 bg-[#C9963B]" />
                    <div className="text-center flex-1">
                      <p className="text-xs text-[#6B7B8D]">Maximum</p>
                      <p className="text-xl font-bold text-[#1B4D5C]">{formatIdrCompact(investor.maxTicketSize * 1_000_000_000)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7B8D] mt-2">
                    Projects within this range receive up to 20% match score boost
                  </p>
                </div>

                {/* Two Column: Risk + Horizon */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5F3EF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[#1B4D5C]" />
                      <span className="font-semibold text-[#1C2A33]">Risk Appetite</span>
                    </div>
                    <p className={`text-2xl font-bold ${riskColor}`}>{investor.riskAppetite}</p>
                    <p className="text-xs text-[#6B7B8D] mt-1">
                      Target IRR: {investor.riskAppetite === 'Conservative' ? '10-16%' : 
                                   investor.riskAppetite === 'Moderate' ? '15-22%' : '20-30%'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F5F3EF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#1B4D5C]" />
                      <span className="font-semibold text-[#1C2A33]">Investment Horizon</span>
                    </div>
                    <p className={`text-2xl font-bold ${horizonColor}`}>{investor.investmentHorizon}</p>
                    <p className="text-xs text-[#6B7B8D] mt-1">
                      Payback: {investor.investmentHorizon === 'Short' ? '< 5 years' : 
                                investor.investmentHorizon === 'Medium' ? '5-10 years' : '> 10 years'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Preferences */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Regional Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {investor.preferredProvinces.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1C2A33] mb-2">Preferred Provinces</p>
                    <div className="flex flex-wrap gap-2">
                      {investor.preferredProvinces.map(p => (
                        <Badge key={p} variant="outline" className="border-[#1B4D5C] text-[#1B4D5C] px-3 py-1">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {investor.preferredRegions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1C2A33] mb-2">Preferred Islands/Regions</p>
                    <div className="flex flex-wrap gap-2">
                      {investor.preferredRegions.map(r => (
                        <Badge key={r} variant="secondary" className="px-3 py-1">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Focus Areas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {investor.focusAreas.map(area => (
                    <Badge key={area} className="bg-[#C9963B]/20 text-[#C9963B] border border-[#C9963B]/30 px-3 py-1">
                      {area}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[#6B7B8D] mt-3">
                  Projects matching these themes receive up to 10% match score boost
                </p>
              </CardContent>
            </Card>

            {/* Interaction History */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Interaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interactionHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#F5F3EF] rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === 'view' ? 'bg-blue-100' :
                        item.type === 'save' ? 'bg-[#C9963B]/20' :
                        item.type === 'inquiry' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {item.type === 'view' ? <Eye className="w-4 h-4 text-blue-600" /> :
                         item.type === 'save' ? <Bookmark className="w-4 h-4 text-[#C9963B]" /> :
                         item.type === 'share' ? <Share2 className="w-4 h-4 text-gray-600" /> :
                         <MessageSquare className="w-4 h-4 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#1C2A33]">
                          <strong>{item.action}</strong> {item.target}
                        </p>
                        <p className="text-xs text-[#6B7B8D]">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    <strong>6 interactions</strong> recorded. Collaborative Filtering activates at 3+ interactions. 
                    More interactions = better recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Profile Impact */}
          <div className="space-y-6">
            {/* Profile Completeness */}
            <Card className="border-0 shadow-md bg-[#1B4D5C] text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <HardHat className="w-5 h-5" /> Profile Impact on Recommendations
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sector Preferences</span>
                      <span className="text-[#C9963B]">25% weight</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#C9963B] h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ticket Size Fit</span>
                      <span className="text-[#C9963B]">20% weight</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#C9963B] h-2 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Region Match</span>
                      <span className="text-[#C9963B]">20% weight</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#C9963B] h-2 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Risk Alignment</span>
                      <span className="text-[#C9963B]">15% weight</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white/60 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Horizon Fit</span>
                      <span className="text-[#C9963B]">10% weight</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white/60 h-2 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Focus Area Match</span>
                      <span className="text-[#C9963B]">10% weight</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white/60 h-2 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Profile Score */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-[#6B7B8D] mb-2">Profile Completeness</p>
                <p className="text-4xl font-bold text-[#1B4D5C] mb-2">85%</p>
                <Progress value={85} className="h-2 mb-4" />
                <p className="text-xs text-[#6B7B8D]">
                  Add more focus areas and past sectors to reach 100%
                </p>
              </CardContent>
            </Card>

            {/* How CF Works */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#1B4D5C] mb-3">How Recommendations Work</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1B4D5C] text-white text-xs flex items-center justify-center flex-shrink-0">1</div>
                    <p className="text-[#6B7B8D]">Your <strong>profile attributes</strong> (sector, ticket size, region) are compared with each project</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1B4D5C] text-white text-xs flex items-center justify-center flex-shrink-0">2</div>
                    <p className="text-[#6B7B8D]">Your <strong>interaction history</strong> (views, saves, inquiries) is compared with similar investors</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#C9963B] text-white text-xs flex items-center justify-center flex-shrink-0">3</div>
                    <p className="text-[#6B7B8D]">The system combines both signals (60% profile + 40% behavior) for final ranking</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Button (placeholder) */}
            <Button className="w-full bg-[#C9963B] hover:bg-[#B0802F] text-white py-6 text-lg font-semibold">
              <Edit3 className="w-5 h-5 mr-2" /> Edit Profile (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
