import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projects } from '@/data/mockData';
import { Star, Target, Zap, Bookmark, Eye, ThumbsUp } from 'lucide-react';

export function Dashboard() {
  const recommendedProjects = projects.slice(0, 3);
  const savedProjects = projects.slice(2, 4);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B4D5C]">Investor Dashboard</h1>
          <p className="text-[#6B7B8D]">AI-powered insights and recommendations</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7B8D]">AI Match Accuracy</p>
                  <p className="text-2xl font-bold text-[#1B4D5C]">78%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1B4D5C]/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#1B4D5C]" />
                </div>
              </div>
              <Progress value={78} className="mt-3 h-2" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7B8D]">Projects Viewed</p>
                  <p className="text-2xl font-bold text-[#1B4D5C]">12</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#C9963B]/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#C9963B]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7B8D]">Saved Projects</p>
                  <p className="text-2xl font-bold text-[#1B4D5C]">5</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1B4D5C]/10 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-[#1B4D5C]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7B8D]">Inquiries Sent</p>
                  <p className="text-2xl font-bold text-[#1B4D5C]">3</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#C9963B]/10 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-[#C9963B]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recommended" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="recommended">AI Recommended</TabsTrigger>
            <TabsTrigger value="saved">Saved Projects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended">
            <div className="grid md:grid-cols-3 gap-6">
              {recommendedProjects.map((project) => (
                <Card key={project.id} className="border-0 shadow-lg">
                  <div className="relative h-40 overflow-hidden rounded-t-lg">
                    <img src={project.image} alt={project.nameEn} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-[#C9963B] text-white">
                        <Star className="w-3 h-3 mr-1" /> {project.matchScore}% Match
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-[#1B4D5C] mb-1">{project.nameEn}</h3>
                    <p className="text-sm text-[#6B7B8D] mb-3">{project.province} — {project.location}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#1B4D5C] font-semibold">Rp {project.investmentValue}T</span>
                      <span className="text-[#C9963B] font-semibold">{project.irr}% IRR</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid md:grid-cols-2 gap-6">
              {savedProjects.map((project) => (
                <Card key={project.id} className="border-0 shadow-lg">
                  <div className="flex">
                    <div className="w-32 h-32 flex-shrink-0">
                      <img src={project.image} alt={project.nameEn} className="w-full h-full object-cover rounded-l-lg" />
                    </div>
                    <CardContent className="p-4 flex-1">
                      <h3 className="font-bold text-[#1B4D5C] mb-1">{project.nameEn}</h3>
                      <p className="text-sm text-[#6B7B8D] mb-2">{project.province}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-[#1B4D5C] font-semibold">Rp {project.investmentValue}T</span>
                        <span className="text-[#C9963B] font-semibold">{project.irr}% IRR</span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1B4D5C]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { action: 'Viewed project', target: 'HPAL Nickel Processing Facility', time: '2 hours ago', icon: Eye },
                  { action: 'Saved project', target: 'Hyperscale Data Center Hub', time: '5 hours ago', icon: Bookmark },
                  { action: 'Sent inquiry', target: 'Batang Integrated Industrial Zone', time: '1 day ago', icon: ThumbsUp },
                  { action: 'Updated profile', target: 'Sector preferences: Industri, Digital', time: '2 days ago', icon: Zap },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#1B4D5C]/10 flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-[#1B4D5C]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#1C2A33]"><strong>{activity.action}</strong> — {activity.target}</p>
                      <p className="text-xs text-[#6B7B8D]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
