'use client';

import { useState } from 'react';
import { messagesAPI } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Package, MapPin, Calendar, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteSettings } from '@/components/site-settings-context';

export default function HowItWorksPage() {
  const { how_it_works_heading, how_it_works_subheading } = useSiteSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await messagesAPI.create({
        sender_name: name,
        content: `${email}: ${message}`,
      });
      toast.success('Thanks for your message! We\'ll get back to you soon.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      icon: Calendar,
      title: '1. Browse & Pick a Date',
      desc: 'Choose your decoration and check real-time availability on the product page. Our calendar updates as bookings come in.',
    },
    {
      icon: Truck,
      title: '2. Choose Setup or Pickup',
      desc: 'Select "We set it up" for delivery and full setup within Auckland, or "I\'ll pick it up" to collect from our storage.',
    },
    {
      icon: MapPin,
      title: '3. Enter Your Venue',
      desc: 'If you choose setup, enter your venue address. We\'ll confirm if it\'s within our standard Auckland service area.',
    },
    {
      icon: Check,
      title: '4. Reserve & Pay',
      desc: 'Submit your reservation and we\'ll confirm within 24 hours with payment details. Pay by card, bank transfer, or Afterpay.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/17206082/pexels-photo-17206082.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')" }}
        />
        <div className="absolute inset-0 bg-sage-900/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-white text-balance">
            {how_it_works_heading}
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-xl">
            {how_it_works_subheading}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <Card key={i} className="border-border/50 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-sage-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-sage-800">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Service area note */}
        <Card className="mt-8 border-blush-200 bg-blush-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-blush-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-serif text-lg font-semibold text-sage-800">
                  Outside Auckland?
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We&apos;re based in Auckland and offer full setup service within the region.
                  If your venue is outside our standard area, just send us a message with your
                  address and we&apos;ll confirm pricing. We can often travel further for the
                  right event — it just needs a quick conversation first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup info */}
        <Card className="mt-4 border-sage-200 bg-sage-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Package className="h-6 w-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-serif text-lg font-semibold text-sage-800">
                  Prefer to Pick Up?
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  You&apos;re welcome to collect your rental from our Auckland storage and set
                  it up yourself. We&apos;ll arrange a pickup time that works for you and show
                  you how everything goes together. No setup fee, just the rental price.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-gold-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-serif text-lg font-semibold text-sage-800">
                  Payment Options
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We accept credit/debit cards via Stripe, bank transfer, and Afterpay.
                  For rentals, we&apos;ll send payment details after confirming your booking —
                  typically within 24 hours of your reservation request.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick contact */}
      <section className="container mx-auto max-w-2xl px-4 pb-20">
        <Card className="border-border/50">
          <CardContent className="pt-6 pb-6">
            <h3 className="font-serif text-2xl font-semibold text-sage-800 mb-2 text-center">
              Have a Question?
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Send us a quick message and we&apos;ll get back to you.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="hiw-name" className="mb-1.5 block">Your name</Label>
                <Input id="hiw-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <Label htmlFor="hiw-email" className="mb-1.5 block">Email</Label>
                <Input id="hiw-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@email.com" />
              </div>
              <div>
                <Label htmlFor="hiw-msg" className="mb-1.5 block">Message</Label>
                <Textarea id="hiw-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your wedding..." rows={4} />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-sage-700 hover:bg-sage-800 text-white"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
