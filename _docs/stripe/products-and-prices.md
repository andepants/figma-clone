# Stripe Products & Prices

**Purpose:** Document Stripe product structure for CanvasIcons subscription tiers.

**Implementation:** Create products in Stripe Dashboard (Test Mode first, then Production).

---

## Product 1: CanvasIcons Founders Access

### Overview
- **Name:** CanvasIcons Founders Access
- **Description:** Limited-time deal for first 10 users - $10/year (normally $90/year)
- **Tier:** `founders`
- **Availability:** First 10 users only

### Pricing
- **Amount:** $10 USD
- **Billing Cycle:** Annual (yearly)
- **Currency:** USD
- **Trial Period:** None (founders deal)

### Stripe Metadata
```json
{
  "tier": "founders",
  "maxUsers": "10",
  "features": "unlimited_projects,public_private,all_templates",
  "discountedFrom": "90.00",
  "dealType": "founders"
}
```

### Features Included
- ✅ Unlimited private projects
- ✅ Public project sharing
- ✅ All templates (blank, feature graphic, app icon)
- ✅ Real-time collaboration
- ✅ High-resolution export (1x, 2x, 3x)
- ✅ Priority support
- ✅ Early access to new features

### Product ID & Price ID
**Test Mode:**
- Product ID: `prod_test_founders` (to be created)
- Price ID: `price_test_founders_annual` (to be created)

**Production:**
- Product ID: `prod_founders` (to be created)
- Price ID: `price_founders_annual` (to be created)

### Configuration Steps

#### 1. Create Product in Stripe Dashboard
1. Go to Products → Create Product
2. Set name: "CanvasIcons Founders Access"
3. Set description: "Limited-time deal for first 10 users - $10/year"
4. Upload icon/logo (optional)

#### 2. Create Price
1. Click "Add price"
2. Set amount: $10 USD
3. Set billing: Recurring → Annual
4. No trial period
5. Save price

#### 3. Add Metadata (Product Level)
1. Go to product → Metadata section
2. Add keys:
   - `tier`: `founders`
   - `maxUsers`: `10`
   - `features`: `unlimited_projects,public_private,all_templates`
   - `discountedFrom`: `90.00`
   - `dealType`: `founders`

#### 4. Copy Price ID
1. Copy the Price ID (starts with `price_`)
2. Add to `.env.local`:
   ```
   VITE_STRIPE_FOUNDERS_PRICE_ID=price_xxxxx
   ```

---

## Product 2: CanvasIcons Pro (Future - Phase 2)

### Overview
- **Name:** CanvasIcons Pro
- **Description:** Professional app icon design with unlimited projects and collaboration
- **Tier:** `pro`
- **Availability:** Unlimited

### Pricing Options

#### Option 1: Annual Billing (Recommended)
- **Amount:** $90 USD/year ($7.50/month billed annually)
- **Billing Cycle:** Annual (yearly)
- **Currency:** USD
- **Trial Period:** 14 days

#### Option 2: Monthly Billing
- **Amount:** $10 USD/month
- **Billing Cycle:** Monthly
- **Currency:** USD
- **Trial Period:** 14 days

### Stripe Metadata
```json
{
  "tier": "pro",
  "features": "unlimited_projects,public_private,all_templates,priority_support",
  "recommended": "true"
}
```

### Features Included
- ✅ Everything in Founders
- ✅ Priority support (24-hour response)
- ✅ Advanced export options (SVG, PDF - future)
- ✅ API access (future)
- ✅ Team workspaces (future)

### Product ID & Price IDs
**Test Mode:**
- Product ID: `prod_test_pro`
- Price ID (Annual): `price_test_pro_annual`
- Price ID (Monthly): `price_test_pro_monthly`

**Production:**
- Product ID: `prod_pro`
- Price ID (Annual): `price_pro_annual`
- Price ID (Monthly): `price_pro_monthly`

---

## Webhook Events to Handle

### 1. `checkout.session.completed`
**Trigger:** User completes Stripe Checkout payment

**Action:**
1. Get `customer` and `subscription` from session
2. Update Firestore `/users/{userId}/subscription`:
   ```typescript
   {
     status: 'founders' | 'pro',
     stripeCustomerId: session.customer,
     stripePriceId: session.subscription.items.data[0].price.id,
     currentPeriodEnd: session.subscription.current_period_end * 1000,
     cancelAtPeriodEnd: false
   }
   ```
3. Decrement `/config/founders-deal/spotsRemaining` (if founders tier)
4. Send welcome email

### 2. `customer.subscription.updated`
**Trigger:** Subscription renewed, plan changed, or canceled

**Action:**
1. Get updated subscription details
2. Update Firestore `/users/{userId}/subscription`:
   ```typescript
   {
     currentPeriodEnd: subscription.current_period_end * 1000,
     cancelAtPeriodEnd: subscription.cancel_at_period_end,
     stripePriceId: subscription.items.data[0].price.id
   }
   ```
3. If plan changed: Update `status` field

### 3. `customer.subscription.deleted`
**Trigger:** Subscription canceled and period ended

**Action:**
1. Update Firestore `/users/{userId}/subscription`:
   ```typescript
   {
     status: 'free',
     stripeCustomerId: customer.id, // Keep for re-activation
     stripePriceId: null,
     currentPeriodEnd: null,
     cancelAtPeriodEnd: false
   }
   ```
2. Send "subscription ended" email

### 4. `invoice.payment_failed`
**Trigger:** Renewal payment failed

**Action:**
1. Log failure to Firestore `/users/{userId}/paymentIssues`
2. Send "payment failed" email with retry link
3. Stripe auto-retries (default: 4 attempts over 2 weeks)

### 5. `invoice.payment_succeeded`
**Trigger:** Renewal payment succeeded

**Action:**
1. Update Firestore `/users/{userId}/subscription`:
   ```typescript
   {
     currentPeriodEnd: invoice.period_end * 1000
   }
   ```
2. Clear any payment issues
3. Send "payment successful" email (optional)

---

## Founders Deal Management

### Track Remaining Spots

**Firestore Document:** `/config/founders-deal`

```json
{
  "spotsTotal": 10,
  "spotsRemaining": 7,
  "priceId": "price_founders_annual",
  "active": true
}
```

### Update Logic (Cloud Function)

```typescript
// On checkout.session.completed
async function handleFoundersPurchase(session: Stripe.Checkout.Session) {
  const dealRef = db.doc('/config/founders-deal');

  await db.runTransaction(async (transaction) => {
    const dealDoc = await transaction.get(dealRef);
    const spotsRemaining = dealDoc.data()?.spotsRemaining || 0;

    if (spotsRemaining <= 0) {
      throw new Error('Founders deal sold out');
    }

    // Decrement spots
    transaction.update(dealRef, {
      spotsRemaining: spotsRemaining - 1,
      active: spotsRemaining - 1 > 0, // Deactivate if sold out
    });

    // Update user subscription
    const userRef = db.doc(`/users/${session.client_reference_id}`);
    transaction.update(userRef, {
      'subscription.status': 'founders',
      'subscription.stripeCustomerId': session.customer,
      'subscription.stripePriceId': session.subscription.items.data[0].price.id,
      'subscription.currentPeriodEnd': session.subscription.current_period_end * 1000,
    });
  });
}
```

### Display Logic (Frontend)

```typescript
// Check if Founders deal available
const dealConfig = await getDoc(doc(db, '/config/founders-deal'));
const { spotsRemaining, active } = dealConfig.data();

if (active && spotsRemaining > 0) {
  // Show Founders tier with "X spots left" badge
} else {
  // Hide Founders tier, show Pro only
}
```

---

## Environment Variables

### Required Stripe Keys

**`.env.local` (Development):**
```bash
# Stripe Test Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Founders Price ID (Test)
VITE_STRIPE_FOUNDERS_PRICE_ID=price_test_xxxxx

# Pro Price IDs (Test) - Phase 2
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_test_xxxxx
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_test_xxxxx
```

**`.env.production` (Production):**
```bash
# Stripe Live Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Founders Price ID (Live)
VITE_STRIPE_FOUNDERS_PRICE_ID=price_xxxxx

# Pro Price IDs (Live) - Phase 2
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
```

---

## Testing Checklist

### Test Mode (Stripe Dashboard → Developers → Test mode)

- [ ] Create "CanvasIcons Founders Access" product
- [ ] Create $9.99/year price
- [ ] Add metadata to product
- [ ] Copy Price ID to `.env.local`
- [ ] Test checkout flow with test card `4242 4242 4242 4242`
- [ ] Verify webhook events received
- [ ] Verify Firestore updated correctly
- [ ] Test subscription cancellation
- [ ] Test subscription renewal (use Stripe CLI to fast-forward time)

### Test Cards (Stripe)
- **Success:** `4242 4242 4242 4242` (any CVC, future expiry)
- **Decline:** `4000 0000 0000 0002`
- **Insufficient Funds:** `4000 0000 0000 9995`
- **Expired Card:** `4000 0000 0000 0069`
- **Invalid CVC:** `4000 0000 0000 0127`

---

## Pricing Strategy

### Founders Tier ($10/year)
- **Target:** Early adopters
- **Positioning:** Limited-time deal (10 spots only)
- **Value:** 89% discount from regular price
- **Goal:** Build initial user base, gather feedback

### Pro Tier ($90/year or $10/month)
- **Target:** Professional designers, small teams
- **Positioning:** Best value (annual), flexibility (monthly)
- **Value:** Unlimited projects + priority support
- **Goal:** Sustainable recurring revenue

### Free Tier (No payment)
- **Target:** Casual users, students, learners
- **Limitations:** Browse public projects only, can't create
- **Goal:** Funnel to paid tiers, community growth

---

## Next Steps

1. Create Founders product in Stripe Test Mode
2. Copy Price ID to `.env.local`
3. Implement checkout flow (Phase 5)
4. Set up webhook handler (Phase 5)
5. Test with test cards
6. Create Founders product in Stripe Live Mode (when ready to launch)
7. Monitor first 10 purchases, deactivate deal when sold out
