# Founders Deal Firestore Configuration

## Collection: `config`
## Document: `founders-deal`

This document tracks the founders deal promotion for the landing page banner.

### Schema

```typescript
{
  spotsTotal: number;      // Total spots available (10)
  spotsRemaining: number;  // Spots left (decremented on purchase)
  priceId: string;         // Stripe price ID for founders tier
  active: boolean;         // Whether deal is active
}
```

### Example Document

```javascript
// Path: /config/founders-deal
{
  spotsTotal: 10,
  spotsRemaining: 7,
  priceId: "price_xxx", // Replace with actual Stripe price ID
  active: true
}
```

### Setup Instructions

1. Open Firebase Console → Firestore Database
2. Create collection: `config`
3. Add document with ID: `founders-deal`
4. Set fields as shown above

### Usage

The `useFoundersSpots` hook reads this document to display remaining spots on the landing page banner.

```typescript
import { useFoundersSpots } from '@/hooks/useFoundersSpots';

const { spotsLeft, loading } = useFoundersSpots();
// spotsLeft = 7 (from Firestore)
```

### Updates

When a user purchases the founders tier:
- Decrement `spotsRemaining` by 1
- When `spotsRemaining === 0`, banner shows "Waitlist Open" message
