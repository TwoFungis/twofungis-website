import React from 'react';
import { FileText, ClipboardList, CalendarCheck, Wrench, Users, MessageCircle, ShieldCheck, HardHat, Handshake } from 'lucide-react';
import { Card } from './ui/card';

const WhyChooseUs = () => {
  const reasons = [
    { icon: FileText,      title: 'Professional Tendering',     description: 'Clean, documented bids with scope clarity that estimators and PMs can actually rely on.' },
    { icon: ClipboardList, title: 'Detailed Scope Review',      description: 'We review drawings, specs and exclusions carefully before contract — no surprises at closeout.' },
    { icon: Handshake,     title: 'Transparent Inclusions',     description: 'Inclusions and exclusions are written plainly. What you see in the bid is what you get on site.' },
    { icon: CalendarCheck, title: 'Reliable Scheduling',        description: 'Crews integrate with the GC schedule, hit milestones, and communicate early when conditions change.' },
    { icon: Wrench,        title: 'Quality Workmanship',        description: 'Finish work that holds up to deficiency reviews, owner walkthroughs and long-term occupancy.' },
    { icon: Users,         title: 'Project Coordination',       description: 'Coordination with site supers, trades and consultants — we work with the team, not around it.' },
    { icon: MessageCircle, title: 'Responsive Communication',   description: 'Fast replies, clear documentation, and a single point of contact through to closeout.' },
    { icon: ShieldCheck,   title: 'Safety & Compliance',    description: 'WorkSafeBC compliant, $5M liability coverage, and the documentation commercial work requires.' },
    { icon: HardHat,       title: 'Relationship-Driven',        description: 'We&apos;d rather earn repeat work from well-run developers and GCs than chase volume.' }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Finishing" className="h-20 md:h-24 w-auto" />
              <h2 className="text-4xl sm:text-5xl font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Why Work With <span className="text-red-600">Two Fungis Finishing</span>
              </h2>
            </div>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Built around how developers and general contractors actually want finishing trades to operate.
            </p>
          </div>

          {/* Reasons Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((r, i) => {
              const Icon = r.icon;
              return (
                <Card key={i} className="p-6 bg-white border-t-4 border-red-600 hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(34,139,34,0.12)' }}>
                    <Icon style={{ color: '#228B22' }} size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }} dangerouslySetInnerHTML={{ __html: r.title }} />
                  <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }} dangerouslySetInnerHTML={{ __html: r.description }} />
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
