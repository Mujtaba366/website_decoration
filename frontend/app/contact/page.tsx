'use client';

import { useState } from 'react';
// import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Instagram, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // const handleSubmit = async () => {
  //   if (!name || !email || !message) {
  //     toast.error('Please fill in your name, email, and message.');
  //     return;
  //   }
  //   setSubmitting(true);
  //   const { error } = await supabase.from('messages').insert({
  //     sender_name: name,
  //     content: `${email} | ${subject || 'No subject'}: ${message}`,
  //   });
  //   if (error) {
  //     toast.error('Something went wrong. Please try again.');
  //     setSubmitting(false);
  //     return;
  //   }
  //   toast.success('Message sent! We\'ll get back to you within 24 hours.');
  //   setName('');
  //   setEmail('');
  //   setSubject('');
  //   setMessage('');
  //   setSubmitting(false);
  // };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/16120244/pexels-photo-16120244.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')" }}
        />
        <div className="absolute inset-0 bg-sage-900/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-white text-balance">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-xl">
            Questions about rentals, custom requests, or just want to say hello?
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-serif text-3xl font-semibold text-sage-800 mb-6">
              We&apos;d love to hear from you
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Whether you&apos;re planning a wedding, have a question about a specific
              rental, or want to discuss a custom setup, we&apos;re here to help.
              We typically respond within 24 hours.
            </p>

            <div className="space-y-4">
              {[
                { icon: Mail, label: 'Email', value: 'hello@bloomandvow.co.nz' },
                { icon: Phone, label: 'Phone', value: '021 123 4567' },
                { icon: MapPin, label: 'Location', value: 'Auckland, New Zealand' },
                { icon: Instagram, label: 'Instagram', value: '@bloomandvow' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-sage-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-medium text-sage-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="c-name" className="mb-1.5 block">Your name</Label>
                  <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <Label htmlFor="c-email" className="mb-1.5 block">Email</Label>
                  <Input id="c-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@email.com" />
                </div>
                <div>
                  <Label htmlFor="c-subject" className="mb-1.5 block">Subject (optional)</Label>
                  <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Question about the Garden Floral Arch" />
                </div>
                <div>
                  <Label htmlFor="c-msg" className="mb-1.5 block">Message</Label>
                  <Textarea id="c-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your wedding or ask us anything..." rows={5} />
                </div>
                <Button 
                  // onClick={handleSubmit} 
                  disabled={submitting} className="w-full bg-sage-700 hover:bg-sage-800 text-white">
                  {submitting ? 'Sending...' : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
