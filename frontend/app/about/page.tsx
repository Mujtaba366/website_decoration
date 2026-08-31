'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart, Flower2, Sparkles, Users } from 'lucide-react';
import { useSiteSettings } from '@/components/site-settings-context';

export default function AboutPage() {
  const { site_name, about_heading, about_subheading, about_story } = useSiteSettings();
  const storyParagraphs = (about_story || '').split(/\n\s*\n/).filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/19024676/pexels-photo-19024676.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')" }}
        />
        <div className="absolute inset-0 bg-sage-900/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-white text-balance">
            {about_heading}
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-xl">
            {about_subheading}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="prose prose-lg max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div className="aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src="https://images.pexels.com/photos/37828118/pexels-photo-37828118.jpeg?auto=compress&cs=tinysrgb&w=600&h=750"
                alt="Wedding decoration"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src="https://images.pexels.com/photos/14148087/pexels-photo-14148087.jpeg?auto=compress&cs=tinysrgb&w=600&h=750"
                alt="Floral arch at night"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <h2 className="font-serif text-3xl font-semibold text-sage-800 mb-4">
            Hi, we&apos;re {site_name}
          </h2>
          {storyParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className={`text-muted-foreground leading-relaxed ${i === storyParagraphs.length - 1 ? 'mb-12' : 'mb-4'}`}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          {[
            { icon: Heart, title: 'Made with Love', desc: 'Every piece is styled with care, as if it were our own wedding.' },
            { icon: Flower2, title: 'Hand-Curated', desc: 'We select every item ourselves — no mass-market catalog pieces.' },
            { icon: Sparkles, title: 'Attention to Detail', desc: 'From the flowers to the signage, every detail matters to us.' },
            { icon: Users, title: 'Personal Service', desc: 'You deal directly with us — no call centers, no middlemen.' },
          ].map((v, i) => (
            <Card key={i} className="border-border/50 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
                    <v.icon className="h-5 w-5 text-sage-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-sage-800">{v.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
