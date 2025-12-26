import { CreditCard } from 'lucide-react';
import { StripeConfigCard } from '@/components/settings/StripeConfigCard';
import { TrialConfigCard } from '@/components/settings/TrialConfigCard';
import { SubscriptionPlansCard } from '@/components/settings/SubscriptionPlansCard';
import { DiscountCouponsCard } from '@/components/settings/DiscountCouponsCard';

export default function PlansSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Planos & Assinaturas
        </h1>
        <p className="text-muted-foreground">Gerencie planos, pagamentos e cupons de desconto</p>
      </div>

      <StripeConfigCard />
      <TrialConfigCard />
      <SubscriptionPlansCard />
      <DiscountCouponsCard />
    </div>
  );
}
