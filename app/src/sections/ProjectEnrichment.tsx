/**
 * PROJECT ENRICHMENT PANEL
 * Displays scraped enrichment data: incentives, contacts, gallery, documents, video
 * Only shows when enriched data is available (from bkpm_full.json)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EnrichedProject } from '@/data/bkpmFullDataLoader';
import {
  Gift,
  Phone,
  Mail,
  MapPin,
  Image,
  FileText,
  Play,
  ExternalLink,
  Award,
  Building2,
  User,
} from 'lucide-react';

interface ProjectEnrichmentProps {
  project: EnrichedProject;
}

export function ProjectEnrichment({ project }: ProjectEnrichmentProps) {
  const hasIncentives = project.incentives && project.incentives.length > 0;
  const hasContacts = project.contacts && project.contacts.length > 0;
  const hasGallery = project.galleryUrls && project.galleryUrls.length > 0;
  const hasDocuments = project.documentUrls && project.documentUrls.length > 0;
  const hasVideo = !!project.videoUrl;

  if (!hasIncentives && !hasContacts && !hasGallery && !hasDocuments && !hasVideo) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#1B4D5C]/10 p-2 rounded-lg">
          <Award className="w-5 h-5 text-[#1B4D5C]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1C2A33]">Detailed Project Information</h2>
          <p className="text-sm text-[#6B7B8D]">Enriched data from BKPM official portal</p>
        </div>
      </div>

      {/* Industrial Zone Badge */}
      {project.industrialZone && (
        <div className="flex items-center gap-2">
          <Badge className="bg-[#1B4D5C]/10 text-[#1B4D5C] border-[#1B4D5C]/20 px-3 py-1">
            <Building2 className="w-3 h-3 mr-1" />
            {project.industrialZone}
          </Badge>
          {project.kbliCode && (
            <Badge variant="outline" className="text-[#6B7B8D]">
              KBLI: {project.kbliCode}
            </Badge>
          )}
          {project.status && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              {project.status}
            </Badge>
          )}
        </div>
      )}

      {/* Incentives Section */}
      {hasIncentives && <IncentivesCard incentives={project.incentives} />}

      {/* Contacts Section */}
      {hasContacts && <ContactsCard contacts={project.contacts} />}

      {/* Gallery Section */}
      {hasGallery && <GalleryCard urls={project.galleryUrls} mainImage={project.mainImageUrl} />}

      {/* Video Section */}
      {hasVideo && <VideoCard url={project.videoUrl} />}

      {/* Documents Section */}
      {hasDocuments && <DocumentsCard urls={project.documentUrls} />}

      {/* Source Link */}
      {project.sourceUrl && (
        <a
          href={project.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#1B4D5C] hover:text-[#C9963B] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on BKPM Official Portal
        </a>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function IncentivesCard({ incentives }: { incentives: EnrichedProject['incentives'] }) {
  const getIncentiveColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('tax')) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' };
    if (lower.includes('impor') || lower.includes('import')) return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' };
    if (lower.includes('super')) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' };
    if (lower.includes('pemda') || lower.includes('daerah')) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' };
    if (lower.includes('non-fiskal')) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500' };
    return { bg: 'bg-[#C9963B]/10', border: 'border-[#C9963B]/20', text: 'text-[#C9963B]', icon: 'text-[#C9963B]' };
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
          <Gift className="w-4 h-4" /> Investment Incentives ({incentives.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {incentives.map((inc, i) => {
          const colors = getIncentiveColor(inc.name);
          return (
            <div
              key={i}
              className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <Award className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm ${colors.text} mb-1`}>
                    {inc.name}
                  </h4>
                  {inc.regulation && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                      {inc.regulation}
                    </p>
                  )}
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {inc.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ContactsCard({ contacts }: { contacts: EnrichedProject['contacts'] }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
          <User className="w-4 h-4" /> Contact Information ({contacts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((contact, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="font-semibold text-sm text-[#1C2A33] mb-1">{contact.name}</p>
              {contact.address && (
                <p className="text-xs text-gray-500 flex items-start gap-1 mb-1">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{contact.address}</span>
                </p>
              )}
              {contact.phone && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {contact.phone}
                </p>
              )}
              {contact.email && (
                <p className="text-xs text-[#1B4D5C] flex items-center gap-1">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GalleryCard({ urls, mainImage }: { urls: string[]; mainImage?: string }) {
  const allImages = mainImage ? [mainImage, ...urls.filter(u => u !== mainImage)] : urls;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
          <Image className="w-4 h-4" /> Gallery ({allImages.length} photos)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allImages.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group overflow-hidden rounded-lg border border-gray-200 aspect-video"
            >
              <img
                src={url}
                alt={`Project photo ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-project.jpg';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VideoCard({ url }: { url?: string }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
          <Play className="w-4 h-4" /> Project Video
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <video
            controls
            className="w-full h-full"
            poster="/placeholder-project.jpg"
          >
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentsCard({ urls }: { urls: string[] }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
          <FileText className="w-4 h-4" /> Documents ({urls.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {urls.map((url, i) => {
            const filename = url.split('/').pop() || `Document ${i + 1}`;
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-[#1B4D5C] flex-shrink-0" />
                <span className="text-sm text-[#1C2A33] truncate flex-1">{filename}</span>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
