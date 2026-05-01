import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Bot, User, Sparkles, BookOpen, FileText, 
  ShieldCheck, Globe, Loader2, CheckCircle
} from 'lucide-react';
import type { Project } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  processingTime?: string;
  modelUsed?: string;
}

interface SourceCitation {
  document: string;
  pasal?: string;
  ayat?: string;
  url?: string;
}

interface LegalDocumentChatbotProps {
  project: Project;
}

// Mock RAG pipeline responses based on project
function generateMockResponse(query: string, project: Project): { content: string; sources: SourceCitation[]; model: string } {
  const q = query.toLowerCase();
  
  // Tax holiday queries
  if (q.includes('tax') || q.includes('pajak') || q.includes('holiday') || q.includes('insentif')) {
    return {
      content: `Based on Peraturan Menteri Keuangan No. 208/PMK.010/2020 and BKPM Regulation No. 5/2021:

**Tax Holiday Eligibility for ${project.nameEn}:**

1. **Status:** ${project.investmentValue >= 500 ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE (investment below Rp 500B threshold)'}

2. **Type Available:** ${project.sector === 'Manufacturing' || project.sector === 'Energy' ? '100% Corporate Income Tax Reduction' : '50% Investment Allowance'}

3. **Duration:** ${project.sector === 'Manufacturing' ? '20 years' : project.sector === 'Digital' ? '10 years' : '15 years'}

4. **Minimum Investment Required:** Rp ${project.sector === 'Energy' || project.sector === 'Infrastructure' ? '700B - 1,000B' : '500B'}
   • Your project: Rp ${project.investmentValue}T

5. **Application Process:**
   • Submit via OSS RBA (Online Single Submission)
   • BKPM evaluation: 30 business days
   • Ministry of Finance approval: 60 business days
   • Total timeline: ~90 days

6. **Key Condition:** Must be listed in BKPM Priority Sector Masterlist (DIPP). This project ${project.tags.includes('KEK') ? 'is registered as KEK — qualifies for automatic inclusion' : 'requires additional review for masterlist inclusion'}.

**Recommendation:** Apply for tax holiday simultaneously with NIB registration to minimize delay.`,
      sources: [
        { document: 'PMK 208/2020', pasal: 'Pasal 3', ayat: 'Ayat 1', url: 'https://jdih.kemenkeu.go.id/' },
        { document: 'BKPM Reg 5/2021', pasal: 'Pasal 12', url: 'https://www.bkpm.go.id/' },
        { document: `Perda ${project.province}`, pasal: 'Pasal 45', url: '#' },
      ],
      model: 'qwen3.5-122b-a10b',
    };
  }
  
  // Permit / OSS queries
  if (q.includes('permit') || q.includes('izin') || q.includes('oss') || q.includes('license') || q.includes('amdak') || q.includes('ukl')) {
    return {
      content: `**Permit Requirements for ${project.nameEn} (${project.sector} Sector):**

Based on OSS Risk-Based Approach (RBA) and ${project.province} Provincial Regulations:

| No. | Permit | Authority | Status | Est. Timeline |
|-----|--------|-----------|--------|---------------|
| 1 | **NIB** (Business ID) | OSS RBA | ${project.status === 'Verified' ? '✅ Completed' : '🔄 Required'} | 1 day (online) |
| 2 | **Location Permit** | DPMPTSP ${project.province} | 🔄 Required | 14-30 days |
| 3 | **${project.sector === 'Energy' || project.sector === 'Mining' || project.subSector.includes('Steel') ? 'AMDAL' : 'UKL-UPL'}** | KLHK / Bapedalda | 🔄 In Progress | ${project.sector === 'Energy' || project.sector === 'Mining' ? '90-180 days' : '30-60 days'} |
| 4 | **Building Approval (PBG)** | Dinas PUPR | 📝 Required | 30-45 days |
| 5 | **Operational Permit** | Dinas Terkait | 📝 Post-construction | 7-14 days |

**Environmental Category:** ${project.sector === 'Energy' || project.sector === 'Mining' ? 'RED (AMDAL mandatory — high impact)' : project.sector === 'Manufacturing' ? 'ORANGE (UKL-UPL — medium impact)' : 'GREEN (SPPL — low impact)'}

**Critical Path:** ${project.sector === 'Energy' ? 'AMDAL approval is the longest lead item. Start immediately after NIB.' : 'Location Permit + Environmental assessment can run in parallel.'}

**${project.tags.includes('KEK') ? 'KEK BENEFIT: As a KEK-registered project, permits are streamlined through KEK Authority — 30% faster processing.' : ''}**`,
      sources: [
        { document: 'UU 11/2020 (Cipta Kerja)', pasal: 'Pasal 5-17', url: 'https://peraturan.bpk.go.id/' },
        { document: `Perda ${project.province} tentang Investasi`, pasal: 'Pasal 22', url: '#' },
        { document: 'KLHK Reg 4/2021', pasal: 'Pasal 7', url: 'https://jdih.klhk.go.id/' },
      ],
      model: 'qwen3.5-122b-a10b',
    };
  }
  
  // Foreign ownership / DNI
  if (q.includes('foreign') || q.includes('own') || q.includes('dni') || q.includes('penanaman modal') || q.includes('asing')) {
    const maxFDI = project.sector === 'Digital' || project.sector === 'Manufacturing' ? 100 : 
                   project.sector === 'Energy' ? 95 : 
                   project.sector === 'Infrastructure' ? 95 : 
                   project.sector === 'Mining' ? 0 : 
                   project.sector === 'Agriculture' ? 95 : 100;
    
    return {
      content: `**Foreign Ownership (DNI / Negative Investment List) for ${project.sector} Sector:**

Based on Presidential Regulation No. 10/2021 (as amended by Perpres 49/2021):

1. **Classification:** ${maxFDI === 100 ? 'OPEN — 100% Foreign Ownership Permitted' : maxFDI === 95 ? 'CONDITIONALLY OPEN — Up to 95% FDI with conditions' : 'RESTRICTED — FDI limitations apply'}

2. **Maximum Foreign Ownership:** ${maxFDI}%
   • ${maxFDI === 100 ? 'No local partner required. Full foreign control permitted.' : maxFDI === 95 ? 'Minimum 5% local partner required. Board composition must reflect local participation.' : 'Foreign ownership limited. Special permission from BKPM required for participation.'}

3. **Applicable to ${project.nameEn}:**
   • Sector: ${project.sector}
   • Sub-sector: ${project.subSector}
   • ${maxFDI >= 95 ? '✅ This project qualifies for maximum foreign participation' : '⚠️ This project requires BKPM Chairman approval for foreign participation'}

4. **BKPM Masterlist Status:** ${project.tags.includes('KEK') ? 'KEK projects receive automatic priority for FDI approval.' : 'Standard approval process — 14 business days.'}

5. **Practical Timeline:**
   • Business plan submission: Day 1
   • BKPM principle approval: Day 14
   • Notary / Akta Pendirian: Day 21
   • NIB + FDI compliance: Day 30

**Note:** Since Law 11/2020 (Omnibus Law), most business lines are now open to 100% FDI. Your ${project.sector} sector ${maxFDI === 100 ? 'is fully open' : 'has the following condition: ' + (project.sector === 'Energy' ? 'geothermal max 95%, electricity generation 100% with regional utilization requirement' : 'port operation max 95%, toll road 100% via capital participation')}.`,
      sources: [
        { document: 'Perpres 10/2021 (DNI)', pasal: 'Lampiran I', url: 'https://peraturan.bpk.go.id/' },
        { document: 'UU 11/2020 (Cipta Kerja)', pasal: 'Pasal 77-85', url: 'https://peraturan.bpk.go.id/' },
        { document: 'BKPM Reg 4/2021', pasal: 'Pasal 5', url: 'https://www.bkpm.go.id/' },
      ],
      model: 'qwen3.5-122b-a10b',
    };
  }
  
  // Default / general
  return {
    content: `**Analysis for ${project.nameEn}:**

Based on the regulatory framework for ${project.sector} sector in ${project.province}:

1. **Regulatory Environment:** ${project.status === 'Verified' ? 'This project has verified status with BKPM, indicating principal regulatory approvals are in place.' : 'This project is in the verification pipeline. Key permits are pending.'}

2. **Strategic Classification:** 
   • Priority Sector: ${project.sector === 'Manufacturing' || project.sector === 'Digital' || project.sector === 'Energy' || project.sector === 'Infrastructure' || project.sector === 'Mining' ? '✅ YES — eligible for National Strategic/Priority incentives' : 'Standard sector'}
   • ${project.tags.includes('KEK') ? 'KEK-registered: Eligible for 100% tax allowance, import duty exemption, and streamlined OSS processing.' : 'Non-KEK: Standard incentive regime applies.'}

3. **Investment Value Context:**
   • Your project: Rp ${project.investmentValue}T
   • Tax holiday threshold: Rp 500B - 1,000B (depending on sector)
   • ${project.investmentValue >= 500 ? '✅ Above threshold — tax holiday available' : '⚠️ Below threshold — consider phasing investment to reach threshold'}

4. **Key Documents You Should Review:**
   • Peraturan Pemerintah No. 45/2019 (Tax Holiday Procedures)
   • ${project.tags.includes('KEK') ? 'PP No. 40/2021 (KEK Incentives)' : 'Perda ' + project.province + ' tentang Insentif Investasi'}
   • ${project.sector === 'Energy' || project.sector === 'Mining' ? 'UU 32/2009 (AMDAL Environmental Protection)' : 'UU 11/2020 (Cipta Kerja — Business Licensing)'}

Would you like me to deep-dive into any specific aspect — tax, permits, land acquisition, or labor regulations?`,
    sources: [
      { document: 'UU 11/2020 (Cipta Kerja)', pasal: 'Pasal 5-25', url: 'https://peraturan.bpk.go.id/' },
      { document: `Perda ${project.province}`, pasal: 'Pasal 12-30', url: '#' },
    ],
    model: 'qwen3.5-122b-a10b',
  };
}

export function LegalDocumentChatbot({ project }: LegalDocumentChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your **AI Legal Analyst** powered by:
• **Qwen3.5-122B-A10B** (multilingual legal reasoning)
• **Nemotron Embed/Rerank** (document retrieval)
• **Nemotron OCR** (document parsing)

I can analyze Indonesian legal documents (Perda, AMDAL, OSS regulations) and answer in English. Ask me anything about **${project.nameEn}** — tax incentives, permits, foreign ownership rules, or environmental compliance.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    // Simulate RAG pipeline processing
    await new Promise(r => setTimeout(r, 1500));
    
    const response = generateMockResponse(input, project);
    
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: response.content,
      sources: response.sources,
      processingTime: '1.4s',
      modelUsed: response.model,
    };
    
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  return (
    <Card className="border shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b bg-[#1B4D5C] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold flex items-center gap-2">
                AI Legal Analyst 
                <Badge className="bg-[#C9963B] text-white text-[10px]">32GB GPU Stack</Badge>
              </h3>
              <p className="text-xs text-white/70 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Qwen3.5-122B-A10B + Nemotron Embed + Nemotron Rerank
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="text-[10px] text-white border-white/30">
              <Globe className="w-3 h-3 mr-1" /> ID ↔ EN
            </Badge>
            <Badge variant="outline" className="text-[10px] text-white border-white/30">
              <BookOpen className="w-3 h-3 mr-1" /> Legal RAG
            </Badge>
            <Badge variant="outline" className="text-[10px] text-white border-white/30">
              <ShieldCheck className="w-3 h-3 mr-1" /> Source Cited
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-4 bg-[#F5F3EF]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-[#C9963B]' : 'bg-[#1B4D5C]'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.role === 'user' 
                  ? 'bg-[#C9963B] text-white' 
                  : 'bg-white border shadow-sm text-[#1C2A33]'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                
                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-[10px] font-semibold text-[#6B7B8D] mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Sources Retrieved
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, j) => (
                        <Badge key={j} variant="outline" className="text-[9px] border-[#1B4D5C]/30 text-[#1B4D5C]">
                          {src.document} {src.pasal && `• ${src.pasal}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Meta */}
                {msg.processingTime && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-[#6B7B8D]">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{msg.processingTime}</span>
                    <span>•</span>
                    <span className="font-mono text-[#1B4D5C]">{msg.modelUsed}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1B4D5C] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-3 rounded-lg bg-white border shadow-sm">
                <div className="flex items-center gap-2 text-sm text-[#6B7B8D]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1B4D5C]" />
                  <span>Retrieving documents + Generating answer...</span>
                </div>
                <div className="mt-1 text-[10px] text-[#6B7B8D] font-mono">
                  Stage 1: Nemotron Embed 1B (retrieval) → Stage 2: Llama Rerank 1B (precision) → Stage 3: Qwen3.5-122B-A10B (generation)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about tax, permits, foreign ownership, or environmental compliance..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={isTyping || !input.trim()}
              className="bg-[#1B4D5C] hover:bg-[#143d4a]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            {['Tax holiday eligibility?', 'What permits needed?', 'Foreign ownership rules?', 'Environmental requirements?'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-[10px] px-2 py-1 bg-[#F5F3EF] rounded-full text-[#6B7B8D] hover:bg-[#1B4D5C]/10 hover:text-[#1B4D5C] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
