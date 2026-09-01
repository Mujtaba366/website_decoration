'use client';

import { useState } from 'react';
import { messagesAPI } from '@/lib/api-client';
import { useSiteSettings } from '@/components/site-settings-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Instagram, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const {
    support_email, phone, location, instagram_handle, business_hours,
    contact_heading, contact_subheading, contact_intro_heading, contact_intro_text,
  } = useSiteSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }
    setSubmitting(true);
    try {
      await messagesAPI.create({
        sender_name: name,
        content: `${email} | ${subject || 'No subject'}: ${message}`,
      });
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
            {contact_heading}
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-xl">
            {contact_subheading}
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-serif text-3xl font-semibold text-sage-800 mb-6">
              {contact_intro_heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {contact_intro_text}
            </p>

            <div className="space-y-4">
              {[
                { icon: Mail, label: 'Email', value: support_email },
                { icon: Phone, label: 'Phone', value: phone },
                { icon: MapPin, label: 'Location', value: location },
                { icon: Instagram, label: 'Instagram', value: instagram_handle },
                { icon: Clock, label: 'Hours', value: business_hours },
              ].filter((item) => item.value).map((item, i) => (
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
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-sage-700 hover:bg-sage-800 text-white"
                >
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
