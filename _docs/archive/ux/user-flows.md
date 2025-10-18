# CanvasIcons User Flows

**Last Updated:** 2025-10-16
**Status:** ✅ Complete
**Purpose:** Visual representation of all user journeys through the CanvasIcons app

## Overview

This document maps out 5 critical user flows with decision points, error branches, loading states, and animation trigger points. Each flow follows UX principles of progressive disclosure and immediate feedback.

---

## Flow 1: Free User Journey (Browse & Try)

**Goal:** Allow free users to explore public projects with minimal friction
**UX Principle:** Progressive disclosure - show value before requiring payment

```mermaid
graph TD
    Start[User visits canvasicons.com] -->|First time| Hero[Landing Page Hero]
    Hero -->|Scroll down| Features[Feature Showcase]
    Features -->|Click "Browse Public Projects"| Browse[Public Projects Gallery]

    Browse -->|No auth required| Gallery[Grid of Public Projects]
    Gallery -->|Click project card| Preview[Project Preview Modal]

    Preview -->|Click "Open in Editor"| AuthCheck{User authenticated?}
    AuthCheck -->|No| SignUpPrompt[Sign Up Modal]
    AuthCheck -->|Yes| OpenCanvas[Open Canvas Read-Only]

    SignUpPrompt -->|Click "Sign Up"| SignUpForm[Sign Up Form]
    SignUpForm -->|Submit| Validate{Form valid?}
    Validate -->|No| InlineError[Show inline errors]
    InlineError -->|Fix| SignUpForm
    Validate -->|Yes| Loading[Loading state 200ms]
    Loading -->|Success| Welcome[Welcome Screen]
    Loading -->|Error| AuthError[Show auth error + retry]

    Welcome -->|Animation: fade in| Dashboard[Projects Dashboard - Empty State]
    Dashboard -->|Shows public projects tab| ExplorePublic[Explore Public Projects]

    OpenCanvas -->|Can view, can't edit| ReadOnly[Read-only Canvas]
    ReadOnly -->|Click any tool| UpgradePrompt[Upgrade Banner: "Sign up to create projects"]

    %% Styling
    classDef successPath fill:#dcfce7,stroke:#16a34a
    classDef errorPath fill:#fee2e2,stroke:#dc2626
    classDef loadingPath fill:#fef3c7,stroke:#d97706
    classDef animationPath fill:#e0f2fe,stroke:#0284c7

    class Welcome,Dashboard successPath
    class InlineError,AuthError errorPath
    class Loading loadingPath
    class Hero,Features,Preview animationPath
```

**Animation Trigger Points:**
- Hero section: Fade in + slide up (0.6s)
- Feature cards: Stagger animation (0.1s delay between)
- Project cards: Hover scale (1.02) + shadow lift
- Modal open: Scale in (spring animation)
- Form validation: Shake on error, checkmark on success

**Loading States:**
- Sign up submit: Button spinner + "Creating account..."
- Canvas open: Skeleton screen with shimmer (200ms)

**Error Branches:**
- Invalid email: Inline error "Enter a valid email address"
- Email exists: "This email is already registered. Sign in instead?"
- Network error: "Connection failed. Check your internet and try again."

---

## Flow 2: Paid User (Direct Purchase)

**Goal:** Smooth path from landing page to first paid project
**UX Principle:** Immediate feedback - show payment success within 200ms

```mermaid
graph TD
    Start[Landing Page] -->|Click "Get Started"| PricingCTA{CTA destination}
    PricingCTA -->|Direct sign up| SignUp[Sign Up Form]
    PricingCTA -->|View pricing| PricingPage[Pricing Page]

    PricingPage -->|Scroll| CompareTiers[Tier Comparison Table]
    CompareTiers -->|Click "Start Founders Deal"| AuthCheck{Authenticated?}

    AuthCheck -->|No| SignUp
    AuthCheck -->|Yes| CheckoutRedirect[Redirect to Stripe Checkout]

    SignUp -->|Submit form| CreateAccount[Create Firebase account]
    CreateAccount -->|Success| AutoRedirect[Auto-redirect to Stripe]

    CheckoutRedirect -->|External| StripeCheckout[Stripe Checkout Page]
    StripeCheckout -->|Fill card details| SubmitPayment[Submit Payment]

    SubmitPayment -->|Processing| StripeValidate{Payment valid?}
    StripeValidate -->|No| PaymentError[Payment Error Screen]
    StripeValidate -->|Yes| PaymentSuccess[Payment Success]

    PaymentError -->|Card declined| RetryPrompt["Error: Card declined. Try different card"]
    PaymentError -->|Insufficient funds| RetryPrompt2["Error: Insufficient funds"]
    RetryPrompt -->|Click "Try Again"| StripeCheckout
    RetryPrompt2 -->|Click "Try Again"| StripeCheckout
    PaymentError -->|Click "Cancel"| CancelRedirect[Redirect to /pricing?payment=cancelled]

    PaymentSuccess -->|Stripe webhook fired| WebhookReceived[Webhook: checkout.session.completed]
    WebhookReceived -->|Update Firestore| UpdateUser[Update user.subscription.status = 'founders']
    UpdateUser -->|Redirect to app| SuccessRedirect[/projects?payment=success&session_id=xxx]

    SuccessRedirect -->|Show success banner| SuccessBanner["Success! Welcome to CanvasIcons Founders"]
    SuccessBanner -->|Poll Firestore| PollStatus{Subscription active?}
    PollStatus -->|Not yet| Wait[Wait 1s, poll again]
    Wait --> PollStatus
    PollStatus -->|Yes| Onboarding[Onboarding Flow]

    Onboarding -->|Step 1| Welcome[Welcome Screen: "Let's create your first project"]
    Welcome -->|Animation: confetti| CreateFirst[Create First Project Modal]
    CreateFirst -->|Select template| TemplateGrid[Template options: Blank, App Icon, Feature Graphic]
    TemplateGrid -->|Choose + name project| CreateProject[Create project in Firestore]
    CreateProject -->|Success| OpenCanvas[Open Canvas Editor]
    OpenCanvas -->|Animation: fade in| CanvasReady[Canvas Ready]

    %% Styling
    classDef successPath fill:#dcfce7,stroke:#16a34a
    classDef errorPath fill:#fee2e2,stroke:#dc2626
    classDef paymentPath fill:#fef3c7,stroke:#d97706
    classDef webhookPath fill:#e0f2fe,stroke:#0284c7

    class PaymentSuccess,UpdateUser,SuccessBanner,CanvasReady successPath
    class PaymentError,RetryPrompt,RetryPrompt2 errorPath
    class StripeCheckout,SubmitPayment paymentPath
    class WebhookReceived,PollStatus webhookPath
```

**Animation Trigger Points:**
- Pricing tiers: Fade in on scroll (stagger 0.15s)
- Success banner: Slide down from top (0.4s)
- Confetti: Burst animation on payment success (2s)
- Template cards: Hover lift + glow effect

**Loading States:**
- Checkout redirect: "Redirecting to secure checkout..."
- Poll subscription: Subtle spinner in corner "Activating subscription..."
- Create project: Button disabled + spinner

**Error Branches:**
- Card declined: "Your card was declined. Please try a different payment method."
- Expired card: "This card has expired. Please use a different card."
- Invalid card: "The card number is invalid. Please check and try again."
- Network timeout: "Payment processing is taking longer than expected. Check your dashboard in a few minutes."

**Progressive Disclosure Points:**
- Pricing page: Basic tiers visible, advanced comparison below fold
- Checkout: Card details first, billing address optional (expandable)

---

## Flow 3: Free → Paid Upgrade

**Goal:** Convert free users who hit project limits
**UX Principle:** Error resilience - provide upgrade path at friction points

```mermaid
graph TD
    Start[Free User in Dashboard] -->|Click "Create Project"| CheckLimit{Project limit reached?}
    CheckLimit -->|No| CreateModal[Create Project Modal]
    CheckLimit -->|Yes| UpgradeModal[Upgrade Required Modal]

    UpgradeModal -->|Show benefits| Benefits["Upgrade to create unlimited projects + private projects + templates"]
    Benefits -->|Click "View Pricing"| PricingPage[Pricing Page with ?from=upgrade]
    Benefits -->|Click "Maybe Later"| CloseModal[Return to Dashboard]

    PricingPage -->|Highlight recommended tier| FoundersTier[Founders Deal Highlighted]
    FoundersTier -->|Click "Upgrade Now"| StripeCheckout[Stripe Checkout]

    StripeCheckout -->|Complete payment| PaymentSuccess[Payment Success]
    PaymentSuccess -->|Webhook| UpdateSubscription[Update Firestore subscription]
    UpdateSubscription -->|Redirect| Dashboard[Dashboard with success banner]

    Dashboard -->|Banner: "Upgrade successful!"| Refresh[Refresh project list]
    Refresh -->|Now shows "Create Project" enabled| CreateModal
    CreateModal -->|Select template| Create[Create First Paid Project]
    Create -->|Success| OpenCanvas[Open in Canvas Editor]

    %% Alternative path: Try to edit
    Start -->|Click public project| ViewProject[View Read-Only Project]
    ViewProject -->|Click "Duplicate & Edit"| DuplicateCheck{Can create?}
    DuplicateCheck -->|No - limit hit| UpgradeModal
    DuplicateCheck -->|Yes| DuplicateProject[Duplicate to own projects]

    %% Styling
    classDef successPath fill:#dcfce7,stroke:#16a34a
    classDef upgradePrompt fill:#fef3c7,stroke:#d97706
    classDef freePath fill:#f5f5f5,stroke:#a3a3a3

    class PaymentSuccess,Dashboard,OpenCanvas successPath
    class UpgradeModal,Benefits,PricingPage upgradePrompt
    class CheckLimit,DuplicateCheck freePath
```

**Animation Trigger Points:**
- Upgrade modal: Scale in with backdrop blur (0.3s)
- Benefits list: Check marks animate in (stagger 0.1s)
- Success banner: Slide down + auto-dismiss after 5s
- "Create Project" button: Pulse glow when enabled

**Loading States:**
- Payment processing: "Processing payment..."
- Subscription activation: "Activating Pro features..." (with progress dots)
- Project duplication: "Duplicating project..."

**Error Branches:**
- Payment fails: Show error in modal, keep upgrade modal open
- Webhook delay: Show "Almost there... activating your subscription" (poll for 30s)
- Network error: "Couldn't connect. Your payment may have succeeded. Check your dashboard."

---

## Flow 4: Payment Error Recovery

**Goal:** Help users recover from payment failures with clear guidance
**UX Principle:** Error resilience - specific messages, preserve input, clear recovery path

```mermaid
graph TD
    Start[Stripe Checkout] -->|Submit payment| Processing[Processing Payment]
    Processing -->|Stripe validation| Result{Payment outcome}

    Result -->|Success| Success[Redirect to /projects?payment=success]
    Result -->|Error| ErrorType{Error type}

    ErrorType -->|card_declined| CardDeclined[Error Screen: Card Declined]
    ErrorType -->|insufficient_funds| InsufficientFunds[Error Screen: Insufficient Funds]
    ErrorType -->|expired_card| ExpiredCard[Error Screen: Expired Card]
    ErrorType -->|invalid_card_number| InvalidCard[Error Screen: Invalid Card]
    ErrorType -->|processing_error| ProcessingError[Error Screen: Processing Error]

    CardDeclined -->|Message| Msg1["Your card was declined. Please try a different payment method."]
    InsufficientFunds -->|Message| Msg2["Insufficient funds. Please use a different card."]
    ExpiredCard -->|Message| Msg3["This card has expired. Please use a valid card."]
    InvalidCard -->|Message| Msg4["The card number is invalid. Please check and try again."]
    ProcessingError -->|Message| Msg5["Payment processing failed. Please try again or contact support."]

    Msg1 -->|Button: "Try Different Card"| RetryCheckout[Return to Checkout - Card Input Focused]
    Msg2 -->|Button: "Try Different Card"| RetryCheckout
    Msg3 -->|Button: "Try Different Card"| RetryCheckout
    Msg4 -->|Button: "Fix Card Number"| RetryCheckout
    Msg5 -->|Two buttons| Recovery{User choice}

    Recovery -->|"Try Again"| RetryCheckout
    Recovery -->|"Contact Support"| SupportModal[Support Contact Form]

    SupportModal -->|Pre-filled with error details| SendMessage[Send Support Message]
    SendMessage -->|Success| Confirmation["Message sent. We'll respond within 24 hours."]

    RetryCheckout -->|Card details preserved if possible| Checkout2[Stripe Checkout]
    Checkout2 -->|Try again| Processing

    %% User cancels
    Start -->|Click "Cancel" or back button| CancelCheck{Confirm cancel?}
    CancelCheck -->|Yes| CancelRedirect[Redirect to /pricing?payment=cancelled]
    CancelCheck -->|No| Start

    CancelRedirect -->|Show banner| CancelMsg["Payment cancelled. Your card was not charged."]

    %% Styling
    classDef errorPath fill:#fee2e2,stroke:#dc2626
    classDef recoveryPath fill:#fef3c7,stroke:#d97706
    classDef successPath fill:#dcfce7,stroke:#16a34a

    class CardDeclined,InsufficientFunds,ExpiredCard,InvalidCard,ProcessingError errorPath
    class RetryCheckout,SupportModal,Recovery recoveryPath
    class Success,Confirmation successPath
```

**Animation Trigger Points:**
- Error message: Gentle shake (0.3s)
- Error icon: Bounce in (spring animation)
- Recovery buttons: Hover lift + color shift

**Loading States:**
- Payment processing: Progress bar (indeterminate)
- Support message: "Sending..." button state

**Error Messages (User-Friendly):**
```typescript
{
  card_declined: {
    userMessage: "Your card was declined. Please try a different payment method.",
    recovery: "Try different card",
    icon: "credit-card-x"
  },
  insufficient_funds: {
    userMessage: "Insufficient funds. Please use a different card.",
    recovery: "Try different card",
    icon: "wallet-x"
  },
  expired_card: {
    userMessage: "This card has expired. Please use a valid card.",
    recovery: "Try different card",
    icon: "calendar-x"
  },
  invalid_card_number: {
    userMessage: "The card number is invalid. Please check and try again.",
    recovery: "Fix card number",
    icon: "alert-circle"
  },
  processing_error: {
    userMessage: "Payment processing failed. This could be a temporary issue.",
    recovery: "Try again or contact support",
    icon: "alert-triangle"
  }
}
```

**Edge Cases Handled:**
- Double-submit prevention: Disable button after first click
- Network timeout: Show "Still processing..." after 10s
- Webhook delay: Poll subscription status for 30s before showing error
- Session expired: Redirect to pricing with "Session expired" message

---

## Flow 5: Onboarding (Paid Users)

**Goal:** Guide new paid users to first successful export
**UX Principle:** Progressive disclosure - 5 simple steps, can skip

```mermaid
graph TD
    Start[Payment Success] -->|Redirect to /onboarding| Step0[Welcome Screen]

    Step0 -->|Animation: fade in| Welcome["Welcome to CanvasIcons! Let's get you started."]
    Welcome -->|Progress: 1/5| Step1[Step 1: Create First Project]

    Step1 -->|Show templates| Templates[Choose Template: Blank / App Icon / Feature Graphic]
    Templates -->|Click template| NameProject[Enter Project Name]
    NameProject -->|Submit| CreateProject[Create project in Firestore]
    CreateProject -->|Success| Progress1["Progress: 2/5 - Project created ✓"]

    Progress1 -->|Auto-advance| Step2[Step 2: Explore Canvas Tools]
    Step2 -->|Highlight toolbar| ToolbarHighlight[Interactive Tool Tutorial]
    ToolbarHighlight -->|User clicks any tool| ToolUsed{Tool used?}
    ToolUsed -->|Yes| Progress2["Progress: 3/5 - Tool used ✓"]
    ToolUsed -->|Timeout 30s| AutoAdvance[Auto-advance with message: "Skip for now"]

    Progress2 -->|Next| Step3[Step 3: Create First Shape]
    Step3 -->|Prompt: "Draw a rectangle or circle"| WaitForShape{Shape created?}
    WaitForShape -->|Yes| Progress3["Progress: 4/5 - Shape created ✓"]
    WaitForShape -->|Timeout 30s| AutoAdvance

    Progress3 -->|Next| Step4[Step 4: Try Export]
    Step4 -->|Highlight export button| ExportPrompt["Click Export to save your design"]
    ExportPrompt -->|User clicks export| ExportModal[Export Options Modal]
    ExportModal -->|User exports| Progress4["Progress: 5/5 - Export successful ✓"]

    Progress4 -->|Celebration| Complete[Onboarding Complete Screen]
    Complete -->|Animation: confetti| Congrats["Congratulations! You're all set."]
    Congrats -->|Button: "Start Creating"| Dashboard[Go to Projects Dashboard]

    %% Skip flow
    Step0 -->|Click "Skip Tutorial"| SkipConfirm{Confirm skip?}
    SkipConfirm -->|Yes| Dashboard
    SkipConfirm -->|No| Step0

    Step1 -->|Click "Skip"| Step2
    Step2 -->|Click "Skip"| Step3
    Step3 -->|Click "Skip"| Step4
    Step4 -->|Click "Skip"| Complete

    %% Mark steps as completed in Firestore
    Progress1 -->|Save| UpdateFirestore1[onboarding.completedSteps.push('created_first_project')]
    Progress2 -->|Save| UpdateFirestore2[onboarding.completedSteps.push('used_tool')]
    Progress3 -->|Save| UpdateFirestore3[onboarding.completedSteps.push('created_shape')]
    Progress4 -->|Save| UpdateFirestore4[onboarding.completedSteps.push('exported_file')]

    %% Styling
    classDef progressPath fill:#dcfce7,stroke:#16a34a
    classDef tutorialPath fill:#e0f2fe,stroke:#0284c7
    classDef skipPath fill:#f5f5f5,stroke:#a3a3a3

    class Progress1,Progress2,Progress3,Progress4,Complete progressPath
    class Step1,Step2,Step3,Step4,ToolbarHighlight tutorialPath
    class SkipConfirm,AutoAdvance skipPath
```

**Animation Trigger Points:**
- Welcome screen: Fade in + slide up
- Step transitions: Cross-fade (0.4s)
- Progress bar: Smooth fill animation
- Checkmarks: Scale in + check draw animation
- Confetti: Burst on completion (3s)
- Tool highlights: Pulse glow (infinite until clicked)

**Loading States:**
- Create project: "Creating your first project..."
- Save progress: Subtle spinner in corner (non-blocking)

**Progressive Disclosure:**
- Step 1: Simple template choice (no advanced options)
- Step 2: Show 3 core tools only (hide advanced features)
- Step 3: Guide to basic shapes (don't overwhelm)
- Step 4: Basic export only (1x PNG, hide 2x/3x options)

**Edge Cases:**
- User closes browser: Resume onboarding from last completed step
- User already has projects: Skip to Step 2 (tools)
- User skips all: Mark onboarding.skipped = true in Firestore
- Timeout: Auto-advance after 30s of inactivity per step

---

## Summary of UX Patterns

### Animation Patterns Used
- **Entrance:** Fade in, slide up, scale in, stagger
- **Exit:** Fade out, slide down, scale out
- **Hover:** Scale 1.02, shadow lift, color shift
- **Loading:** Spinner, shimmer, progress bar pulse
- **Success:** Confetti, checkmark draw, green flash
- **Error:** Shake, bounce, red flash

### Loading States
- Button loading: Spinner + text change + disabled
- Page loading: Skeleton screens with shimmer (200ms)
- Background sync: Subtle corner indicator
- Optimistic updates: Show immediately, rollback on error

### Error Recovery
- Specific messages (not generic "Error occurred")
- Preserve user input (don't clear forms)
- Clear recovery actions ("Try different card")
- Visual hierarchy (icon + message + action)

### Progressive Disclosure
- Onboarding: 5 simple steps, skip option
- Export: Basic options first, advanced collapsible
- Pricing: Tiers first, detailed comparison below
- Templates: Popular first, full gallery in modal

---

## Decision Tree Summary

**Key Decision Points:**
1. Authenticated? → Sign up or continue
2. Subscription active? → Free limits or full access
3. Payment valid? → Success or specific error
4. Project limit? → Create or upgrade prompt
5. Onboarding step? → Continue or skip

**Error Branches:**
- Auth errors → Show inline error + retry
- Payment errors → Specific message + recovery action
- Network errors → Retry logic + timeout handling
- Validation errors → Inline feedback + preserve input

---

## Next Steps

1. ✅ User flows documented
2. 🔄 Create micro-animations catalog (task 0.4.2)
3. 🔄 Design error state catalog (task 0.4.3)
4. 🔄 Define loading patterns (task 0.4.4)
5. 🔄 Create empty state catalog (task 0.4.5)

---

**Status:** ✅ All 5 user flows complete with decision points, error branches, loading states, and animation triggers.
