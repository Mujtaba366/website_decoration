'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsAPI, bookingsAPI, deliveryOptionsAPI, blockedDatesAPI } from '@/lib/api-client';
import type { Product, DeliveryOption, BlockedDate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, Truck, Package, MapPin, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/components/cart-context';
import { toast } from 'sonner';

import { isWithinAuckland, toDateOnly } from '@/lib/date-utils';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [qty, setQty] = useState(1);
  const [personalization, setPersonalization] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const products = await productsAPI.list();
        const foundProduct = Array.isArray(products) ? products.find((p: any) => p.slug === slug && p.active) : null;
        if (foundProduct) {
          setProduct(foundProduct);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const options = await deliveryOptionsAPI.list() as DeliveryOption[];
        setDeliveryOptions(options);
        const defaultOption = options.find((o) => o.is_default) || options[0];
        if (defaultOption) setSelectedOptionId(defaultOption.id);
      } catch (err) {
        console.error('Failed to load delivery options:', err);
      }

      try {
        const dates = await blockedDatesAPI.list() as BlockedDate[];
        setBlockedDates(new Set(dates.map((d) => d.date)));
      } catch (err) {
        console.error('Failed to load blocked dates:', err);
      }
    })();
  }, []);

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = toDateOnly(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    return !blockedDates.has(dateStr);
  };

  const outsideAuckland = address.length > 0 && !isWithinAuckland(address);
  const withinAuckland = address.length > 0 && isWithinAuckland(address);
  const selectedOption = deliveryOptions.find((o) => o.id === selectedOptionId);

  const handleReserve = async () => {
    if (!product) return;
    if (!selectedDate) {
      toast.error('Please select an event date.');
      return;
    }
    if (!customerName || !contact) {
      toast.error('Please enter your name and contact details.');
      return;
    }

    setSubmitting(true);
    const dateStr = toDateOnly(selectedDate);

    try {
      await bookingsAPI.create({
        product_id: product.id,
        customer_name: customerName,
        contact,
        event_date: dateStr,
        fulfillment_type: selectedOption?.label || 'pickup',
        delivery_option_id: selectedOptionId || null,
        address: address || null,
        is_within_auckland: address ? isWithinAuckland(address) : null,
        extra_fee: selectedOption?.fee || null,
        status: 'enquiry',
        message: message || null,
      });

      setBlockedDates((prev) => new Set(prev).add(dateStr));
      toast.success(
        outsideAuckland
          ? 'Your enquiry has been sent! We\'ll confirm pricing for your area shortly.'
          : 'Your reservation request has been received! We\'ll be in touch to confirm.'
      );
      setCustomerName('');
      setContact('');
      setAddress('');
      setMessage('');
      setSelectedDate(undefined);
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
      // The date may have just been claimed by someone else mid-checkout -
      // refresh so the calendar reflects reality instead of the user retrying
      // the same now-blocked date.
      try {
        const dates = await blockedDatesAPI.list() as BlockedDate[];
        const fresh = new Set(dates.map((d) => d.date));
        setBlockedDates(fresh);
        if (fresh.has(dateStr)) setSelectedDate(undefined);
      } catch {
        // ignore - non-critical refresh
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.personalization_label && !personalization) {
      toast.error('Please fill in the personalization field.');
      return;
    }
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.base_price,
      image: product.images[0] || '',
      qty,
      personalization: personalization || undefined,
    });
    toast.success(`${product.name} added to cart.`);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-sage-800 mb-4">Product not found</h1>
        <Link href="/rentals">
          <Button variant="outline">Back to Rentals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={product.type === 'rental' ? '/rentals' : '/shop'}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-sage-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {product.type === 'rental' ? 'Rentals' : 'Shop'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image gallery */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
            {product.images[activeImage] && (
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover animate-fade-in"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                    activeImage === i ? 'border-sage-600 ring-2 ring-sage-200' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div>
          <Badge
            variant="secondary"
            className={
              product.type === 'rental'
                ? 'bg-sage-100 text-sage-700 border-sage-200'
                : 'bg-blush-100 text-blush-700 border-blush-200'
            }
          >
            {product.type === 'rental' ? 'For Rent' : 'For Sale'}
          </Badge>
          {product.category && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-3">
              {product.category}
            </p>
          )}
          <h1 className="font-serif text-4xl font-semibold text-sage-800 mt-1">
            {product.name}
          </h1>
          <p className="font-serif text-3xl text-sage-700 mt-3">
            ${product.base_price.toFixed(0)}
            {product.type === 'rental' && (
              <span className="text-sm text-muted-foreground font-sans ml-2">per weekend</span>
            )}
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{product.description}</p>

          {product.type === 'rental' ? (
            <div className="mt-8 space-y-6">
              {/* Date picker */}
              <div>
                <Label className="flex items-center gap-2 mb-3 text-sage-800 font-medium">
                  <CalendarIcon className="h-4 w-4" /> Select your event date
                </Label>
                <div className="rounded-lg border border-border p-4 bg-card">
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
                    ))}
                    {(() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = today.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const cells: React.ReactNode[] = [];
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(year, month, d);
                        const available = isDateAvailable(date);
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        cells.push(
                          <button
                            key={d}
                            disabled={!available}
                            onClick={() => setSelectedDate(date)}
                            className={`aspect-square rounded-md text-sm transition-all ${
                              isSelected
                                ? 'bg-sage-700 text-white font-semibold'
                                : available
                                ? 'hover:bg-sage-100 text-foreground'
                                : 'text-muted-foreground/40 line-through cursor-not-allowed'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  {selectedDate && (
                    <p className="mt-3 text-sm text-sage-700 flex items-center gap-2">
                      <Check className="h-4 w-4" /> Selected: {selectedDate.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery options (admin-configurable) */}
              {deliveryOptions.length > 0 && (
                <div>
                  <Label className="text-sage-800 font-medium mb-3 block">How would you like it?</Label>
                  <RadioGroup value={selectedOptionId} onValueChange={setSelectedOptionId}>
                    <div className="space-y-3">
                      {deliveryOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedOptionId === option.id ? 'border-sage-600 bg-sage-50' : 'border-border hover:bg-muted/50'}`}
                        >
                          <RadioGroupItem value={option.id} className="mt-1" />
                          <div>
                            <div className="flex items-center gap-2">
                              {option.fee > 0 ? (
                                <Truck className="h-4 w-4 text-sage-600" />
                              ) : (
                                <Package className="h-4 w-4 text-sage-600" />
                              )}
                              <span className="font-medium text-sage-800">
                                {option.label}
                                {option.fee > 0 && <span className="text-sm text-muted-foreground font-normal"> (+${option.fee})</span>}
                              </span>
                            </div>
                            {option.description && (
                              <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Venue / delivery address */}
              <div>
                <Label htmlFor="address" className="flex items-center gap-2 mb-2 text-sage-800 font-medium">
                  <MapPin className="h-4 w-4" /> Venue address (if we need to come to you)
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Ponsonby Road, Ponsonby, Auckland 1011"
                />
                {outsideAuckland && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-blush-50 border border-blush-200 animate-fade-in">
                    <AlertCircle className="h-4 w-4 text-blush-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blush-700">
                      This is outside our standard service area — send us a message with your address and we&apos;ll confirm pricing.
                    </p>
                  </div>
                )}
                {withinAuckland && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-sage-50 border border-sage-200 animate-fade-in">
                    <Check className="h-4 w-4 text-sage-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-sage-700">
                      Great — you&apos;re within our Auckland service area.
                    </p>
                  </div>
                )}
              </div>

              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cust-name" className="mb-2 block">Your name</Label>
                  <Input id="cust-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <Label htmlFor="cust-contact" className="mb-2 block">Email or phone</Label>
                  <Input id="cust-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="jane@email.com" />
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="msg" className="mb-2 block">Message (optional)</Label>
                <Textarea
                  id="msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any questions, custom requests, or extra info..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleReserve}
                disabled={submitting}
                size="lg"
                className="w-full bg-sage-700 hover:bg-sage-800 text-white"
              >
                {submitting ? 'Sending...' : outsideAuckland ? 'Send Enquiry' : 'Reserve This Item'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We&apos;ll confirm your booking and send payment details within 24 hours.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {/* Personalization */}
              {product.personalization_label && (
                <div>
                  <Label htmlFor="pers" className="mb-2 block text-sage-800 font-medium">
                    {product.personalization_label}
                  </Label>
                  <Input
                    id="pers"
                    value={personalization}
                    onChange={(e) => setPersonalization(e.target.value)}
                    placeholder="e.g. Sarah & James — 14.02.2026"
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <Label className="mb-2 block text-sage-800 font-medium">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    –
                  </Button>
                  <span className="w-12 text-center font-medium text-lg">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQty(qty + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="shop-msg" className="mb-2 block">Message (optional)</Label>
                <Textarea
                  id="shop-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any custom requests or questions..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full bg-sage-700 hover:bg-sage-800 text-white"
              >
                Add to Cart — ${(product.base_price * qty).toFixed(0)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
