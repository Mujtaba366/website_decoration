'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ordersAPI, paymentsAPI, paymentConfigAPI, checkoutAPI } from '@/lib/api-client';
import type { PaymentConfig } from '@/lib/types';
import { toast } from 'sonner';

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  bank_account_number: null,
  bank_account_name: null,
  bank_transfer_enabled: true,
  stripe_enabled: false,
  stripe_publishable_key: null,
  currency: 'NZD',
};

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('afterpay');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const config = await paymentConfigAPI.get() as PaymentConfig;
        setPaymentConfig(config);
        // Default to whichever method is actually available, preferring
        // bank transfer since it needs no third-party setup.
        if (config.bank_transfer_enabled) setPaymentMethod('bank_transfer');
        else if (config.stripe_enabled) setPaymentMethod('stripe');
      } catch {
        // Keep defaults (bank transfer assumed on, card assumed off) if the
        // backend isn't reachable - matches how useSiteSettings() degrades.
      }
    })();
  }, []);

  const paymentOptions = [
    ...(paymentConfig.stripe_enabled ? [{ id: 'stripe', label: 'Credit/Debit Card (Stripe)' }] : []),
    ...(paymentConfig.bank_transfer_enabled ? [{ id: 'bank_transfer', label: 'Bank Transfer' }] : []),
    { id: 'afterpay', label: 'Afterpay' },
  ];

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!name || !contact) {
      toast.error('Please enter your name and contact details.');
      return;
    }
    setSubmitting(true);

    try {
      const order: any = await ordersAPI.create({
        customer_name: name,
        contact,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          qty: i.qty,
          price: i.price,
          personalization: i.personalization || null,
        })),
        total,
        payment_method: paymentMethod,
        status: 'pending',
      });

      // The order itself already stores payment_method and total - this
      // payments row is a supplementary record, not the source of truth.
      // Treat it as best-effort: if it fails, the order still succeeded,
      // so don't block the customer or risk them retrying and placing a
      // second, duplicate order for the same cart.
      try {
        await paymentsAPI.create({
          order_id: order.id,
          method: paymentMethod,
          amount: total,
          status: 'pending',
        });
      } catch (paymentErr) {
        console.error('Order placed, but failed to record the payment sub-record:', paymentErr);
      }

      if (paymentMethod === 'stripe') {
        try {
          const session = await checkoutAPI.createStripeSession(order.id);
          clearCart();
          window.location.href = session.url;
          return;
        } catch (stripeErr: any) {
          // The order already exists as 'pending' - don't lose it, just
          // let the customer know card payment couldn't start and they can
          // pick a different method or wait to be contacted.
          toast.error(stripeErr?.message || 'Could not start card payment. Your order was saved - please choose another payment method or we\'ll be in touch.');
          setSubmitting(false);
          return;
        }
      }

      toast.success('Order placed! We\'ll be in touch shortly with payment details.');
      clearCart();
      setName('');
      setContact('');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mx-auto mb-6" />
        <h1 className="font-serif text-3xl font-semibold text-sage-800 mb-3">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground mb-8">
          Browse our shop for personalized keepsakes and wedding items.
        </p>
        <Link href="/shop">
          <Button size="lg" className="bg-sage-700 hover:bg-sage-800 text-white">
            Browse Shop <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-4xl font-semibold text-sage-800 mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product_id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <Link href={`/products/${item.slug}`} className="font-serif text-lg font-semibold text-sage-800 hover:text-sage-600">
                      {item.name}
                    </Link>
                    {item.personalization && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.personalization}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => updateQty(item.product_id, item.qty - 1)}>–</Button>
                        <span className="w-10 text-center text-sm font-medium">{item.qty}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQty(item.product_id, item.qty + 1)}>+</Button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-serif text-lg font-semibold text-sage-700">
                          ${(item.price * item.qty).toFixed(0)}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.product_id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout summary */}
        <div>
          <Card className="sticky top-24 border-border/50">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-sage-800">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated after order</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between">
                <span className="font-serif text-lg font-semibold text-sage-800">Total</span>
                <span className="font-serif text-lg font-semibold text-sage-700">${total.toFixed(0)}</span>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="ck-name" className="mb-1.5 block">Your name</Label>
                  <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <Label htmlFor="ck-contact" className="mb-1.5 block">Email or phone</Label>
                  <Input id="ck-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="jane@email.com" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Payment method</Label>
                  <div className="space-y-2">
                    {paymentOptions.map((opt) => (
                      <label key={opt.id} className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer text-sm transition-all ${paymentMethod === opt.id ? 'border-sage-600 bg-sage-50' : 'border-border hover:bg-muted/50'}`}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === opt.id}
                          onChange={() => setPaymentMethod(opt.id)}
                          className="accent-sage-700"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {paymentMethod === 'bank_transfer' && paymentConfig.bank_account_number && (
                    <div className="mt-3 p-3 rounded-md bg-sage-50 border border-sage-200 text-sm">
                      <p className="text-slate-600">Transfer the total to:</p>
                      <p className="font-medium text-sage-800 mt-1">{paymentConfig.bank_account_name}</p>
                      <p className="font-mono text-sage-800">{paymentConfig.bank_account_number}</p>
                      <p className="text-xs text-slate-500 mt-1">Please use your name as the reference. We&apos;ll confirm once received.</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={submitting}
                size="lg"
                className="w-full bg-sage-700 hover:bg-sage-800 text-white"
              >
                {submitting ? 'Placing order...' : 'Place Order'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We&apos;ll confirm your order and send payment instructions within 24 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
