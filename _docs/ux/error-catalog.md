# Error State Catalog

**Purpose:** Comprehensive error catalog with user-friendly messages, recovery paths, and visual treatments.

**UX Principle:** Error resilience - always provide recovery path, preserve user input, be specific.

---

## Error Categories

### 1. Authentication Errors (8 scenarios)

#### AUTH_WRONG_PASSWORD
- **Code:** `auth/wrong-password`
- **User Message:** "Incorrect password. Please try again."
- **Technical Message:** "Firebase Auth: wrong-password"
- **Recovery Action:** "Try again or reset password"
- **Visual Treatment:** Inline below password field
- **Preserve Input:** Yes (email preserved, password cleared)
- **Severity:** Error

#### AUTH_USER_NOT_FOUND
- **Code:** `auth/user-not-found`
- **User Message:** "No account found with this email. Would you like to sign up?"
- **Technical Message:** "Firebase Auth: user-not-found"
- **Recovery Action:** Link to sign up page
- **Visual Treatment:** Inline below email field
- **Preserve Input:** Yes
- **Severity:** Error

#### AUTH_EMAIL_EXISTS
- **Code:** `auth/email-already-in-use`
- **User Message:** "An account with this email already exists. Try signing in instead."
- **Technical Message:** "Firebase Auth: email-already-in-use"
- **Recovery Action:** Link to sign in page
- **Visual Treatment:** Inline below email field
- **Preserve Input:** Yes
- **Severity:** Error

#### AUTH_WEAK_PASSWORD
- **Code:** `auth/weak-password`
- **User Message:** "Password must be at least 8 characters with letters and numbers."
- **Technical Message:** "Firebase Auth: weak-password"
- **Recovery Action:** "Enter a stronger password"
- **Visual Treatment:** Inline below password field
- **Preserve Input:** Yes (show password requirements)
- **Severity:** Error

#### AUTH_INVALID_EMAIL
- **Code:** `auth/invalid-email`
- **User Message:** "Please enter a valid email address."
- **Technical Message:** "Firebase Auth: invalid-email"
- **Recovery Action:** "Correct email format"
- **Visual Treatment:** Inline below email field
- **Preserve Input:** Yes
- **Severity:** Error

#### AUTH_TOO_MANY_REQUESTS
- **Code:** `auth/too-many-requests`
- **User Message:** "Too many failed attempts. Please try again in 5 minutes or reset your password."
- **Technical Message:** "Firebase Auth: too-many-requests"
- **Recovery Action:** "Wait 5 minutes or reset password"
- **Visual Treatment:** Banner at top of form
- **Preserve Input:** Yes
- **Severity:** Warning

#### AUTH_SESSION_EXPIRED
- **Code:** `auth/session-expired`
- **User Message:** "Your session has expired. Please sign in again."
- **Technical Message:** "Firebase Auth: session-expired"
- **Recovery Action:** "Redirect to sign in"
- **Visual Treatment:** Modal overlay
- **Preserve Input:** No (security)
- **Severity:** Warning

#### AUTH_NETWORK_ERROR
- **Code:** `auth/network-request-failed`
- **User Message:** "Connection error. Check your internet and try again."
- **Technical Message:** "Firebase Auth: network-request-failed"
- **Recovery Action:** "Retry button"
- **Visual Treatment:** Banner at top
- **Preserve Input:** Yes
- **Severity:** Error

---

### 2. Payment Errors (10 scenarios)

#### PAYMENT_CARD_DECLINED
- **Code:** `card_declined`
- **User Message:** "Your card was declined. Please try a different payment method."
- **Technical Message:** "Stripe: card_declined"
- **Recovery Action:** "Try different card or contact bank"
- **Visual Treatment:** Inline below payment form
- **Preserve Input:** Yes (don't clear card fields)
- **Severity:** Error

#### PAYMENT_INSUFFICIENT_FUNDS
- **Code:** `insufficient_funds`
- **User Message:** "Your card has insufficient funds. Please use a different card."
- **Technical Message:** "Stripe: insufficient_funds"
- **Recovery Action:** "Try different card"
- **Visual Treatment:** Inline below payment form
- **Preserve Input:** Yes
- **Severity:** Error

#### PAYMENT_EXPIRED_CARD
- **Code:** `expired_card`
- **User Message:** "Your card has expired. Please use a different card."
- **Technical Message:** "Stripe: expired_card"
- **Recovery Action:** "Enter valid card"
- **Visual Treatment:** Inline below card expiry field
- **Preserve Input:** Yes
- **Severity:** Error

#### PAYMENT_INVALID_CARD
- **Code:** `invalid_card_number`
- **User Message:** "Invalid card number. Please check and try again."
- **Technical Message:** "Stripe: invalid_card_number"
- **Recovery Action:** "Re-enter card number"
- **Visual Treatment:** Inline below card number field
- **Preserve Input:** Yes (highlight invalid field)
- **Severity:** Error

#### PAYMENT_INVALID_CVC
- **Code:** `invalid_cvc`
- **User Message:** "Invalid security code (CVC). Please check your card."
- **Technical Message:** "Stripe: invalid_cvc"
- **Recovery Action:** "Re-enter CVC"
- **Visual Treatment:** Inline below CVC field
- **Preserve Input:** Yes
- **Severity:** Error

#### PAYMENT_PROCESSING_ERROR
- **Code:** `processing_error`
- **User Message:** "Payment failed to process. Please try again or contact support."
- **Technical Message:** "Stripe: processing_error"
- **Recovery Action:** "Retry or contact support"
- **Visual Treatment:** Modal overlay
- **Preserve Input:** Yes
- **Severity:** Error

#### PAYMENT_RATE_LIMIT
- **Code:** `rate_limit`
- **User Message:** "Too many payment attempts. Please wait a moment and try again."
- **Technical Message:** "Stripe: rate_limit"
- **Recovery Action:** "Wait 30 seconds"
- **Visual Treatment:** Banner at top
- **Preserve Input:** Yes
- **Severity:** Warning

#### PAYMENT_INCOMPLETE
- **Code:** `incomplete_payment`
- **User Message:** "Please complete all required fields to continue."
- **Technical Message:** "Stripe: incomplete_payment"
- **Recovery Action:** "Fill missing fields (highlighted)"
- **Visual Treatment:** Inline near missing fields
- **Preserve Input:** Yes
- **Severity:** Error

#### PAYMENT_WEBHOOK_FAILED
- **Code:** `webhook_verification_failed`
- **User Message:** "Payment successful but verification pending. Check back in a minute."
- **Technical Message:** "Webhook signature verification failed"
- **Recovery Action:** "Refresh page in 60 seconds"
- **Visual Treatment:** Banner with auto-refresh
- **Preserve Input:** N/A
- **Severity:** Warning

#### PAYMENT_SUBSCRIPTION_ERROR
- **Code:** `subscription_create_failed`
- **User Message:** "Failed to activate subscription. Your card was not charged. Please try again."
- **Technical Message:** "Stripe: subscription creation failed"
- **Recovery Action:** "Retry payment"
- **Visual Treatment:** Modal overlay
- **Preserve Input:** Yes
- **Severity:** Error

---

### 3. Permission Errors (5 scenarios)

#### PERMISSION_FREE_TIER_LIMIT
- **Code:** `free_tier_create_limit`
- **User Message:** "Free accounts can't create projects. Upgrade to CanvasIcons Founders ($9.99/year) to create unlimited projects."
- **Technical Message:** "User subscription status: free, action: create_project denied"
- **Recovery Action:** "Upgrade to Founders (CTA button)"
- **Visual Treatment:** Modal overlay with pricing
- **Preserve Input:** N/A
- **Severity:** Info

#### PERMISSION_PROJECT_ACCESS_DENIED
- **Code:** `project_access_denied`
- **User Message:** "You don't have access to this project. Request access from the owner or browse public projects."
- **Technical Message:** "User not in project.collaborators array"
- **Recovery Action:** "Browse public projects or go to dashboard"
- **Visual Treatment:** Full-page error state
- **Preserve Input:** N/A
- **Severity:** Error

#### PERMISSION_PROJECT_NOT_FOUND
- **Code:** `project_not_found`
- **User Message:** "Project not found. It may have been deleted or made private."
- **Technical Message:** "Firestore: No document at /projects/{id}"
- **Recovery Action:** "Go to projects dashboard"
- **Visual Treatment:** Full-page error state
- **Preserve Input:** N/A
- **Severity:** Error

#### PERMISSION_MODIFY_LOCKED_OBJECT
- **Code:** `object_locked`
- **User Message:** "This object is locked. Unlock it first to make changes."
- **Technical Message:** "Canvas object property: locked = true"
- **Recovery Action:** "Unlock from layers panel"
- **Visual Treatment:** Inline tooltip on canvas
- **Preserve Input:** N/A (action prevented)
- **Severity:** Info

#### PERMISSION_REQUIRES_AUTH
- **Code:** `auth_required`
- **User Message:** "Sign in to access this feature."
- **Technical Message:** "Protected route accessed without authentication"
- **Recovery Action:** "Redirect to sign in with return URL"
- **Visual Treatment:** Modal overlay
- **Preserve Input:** N/A
- **Severity:** Warning

---

### 4. Network Errors (4 scenarios)

#### NETWORK_OFFLINE
- **Code:** `network_offline`
- **User Message:** "You're offline. Changes will sync when you reconnect."
- **Technical Message:** "navigator.onLine = false"
- **Recovery Action:** "Auto-retry when online"
- **Visual Treatment:** Persistent banner at top (dismissible)
- **Preserve Input:** Yes (queue changes)
- **Severity:** Warning

#### NETWORK_TIMEOUT
- **Code:** `network_timeout`
- **User Message:** "Request timed out. Please check your connection and try again."
- **Technical Message:** "Request exceeded 30s timeout"
- **Recovery Action:** "Retry button"
- **Visual Treatment:** Inline near failed action
- **Preserve Input:** Yes
- **Severity:** Error

#### NETWORK_SLOW_CONNECTION
- **Code:** `slow_connection`
- **User Message:** "Slow connection detected. Some features may be delayed."
- **Technical Message:** "RTT > 2000ms"
- **Recovery Action:** "Continue with degraded experience"
- **Visual Treatment:** Toast notification (auto-dismiss 5s)
- **Preserve Input:** Yes
- **Severity:** Info

#### NETWORK_FIREBASE_ERROR
- **Code:** `firebase_unavailable`
- **User Message:** "Service temporarily unavailable. Please try again in a moment."
- **Technical Message:** "Firebase RTDB/Firestore connection error"
- **Recovery Action:** "Auto-retry with exponential backoff"
- **Visual Treatment:** Banner at top
- **Preserve Input:** Yes
- **Severity:** Error

---

### 5. Validation Errors (8 scenarios)

#### VALIDATION_PROJECT_NAME_EMPTY
- **Code:** `project_name_required`
- **User Message:** "Project name is required."
- **Technical Message:** "Validation: name.length === 0"
- **Recovery Action:** "Enter project name"
- **Visual Treatment:** Inline below name field
- **Preserve Input:** Yes
- **Severity:** Error

#### VALIDATION_PROJECT_NAME_TOO_LONG
- **Code:** `project_name_too_long`
- **User Message:** "Project name must be 100 characters or less."
- **Technical Message:** "Validation: name.length > 100"
- **Recovery Action:** "Shorten project name"
- **Visual Treatment:** Inline below name field (show char count)
- **Preserve Input:** Yes
- **Severity:** Error

#### VALIDATION_USERNAME_INVALID
- **Code:** `username_invalid`
- **User Message:** "Username must be 3-20 characters (letters, numbers, underscores only)."
- **Technical Message:** "Validation: !usernameRegex.test(username)"
- **Recovery Action:** "Enter valid username"
- **Visual Treatment:** Inline below username field
- **Preserve Input:** Yes
- **Severity:** Error

#### VALIDATION_USERNAME_TAKEN
- **Code:** `username_exists`
- **User Message:** "This username is already taken. Please choose another."
- **Technical Message:** "Firestore: username exists in users collection"
- **Recovery Action:** "Try different username (show suggestions)"
- **Visual Treatment:** Inline below username field
- **Preserve Input:** Yes
- **Severity:** Error

#### VALIDATION_EXPORT_NO_OBJECTS
- **Code:** `export_no_objects`
- **User Message:** "Canvas is empty. Add objects before exporting."
- **Technical Message:** "Canvas objects.length === 0"
- **Recovery Action:** "Close modal, add objects"
- **Visual Treatment:** Empty state in export modal
- **Preserve Input:** N/A
- **Severity:** Info

#### VALIDATION_EXPORT_NO_SELECTION
- **Code:** `export_no_selection`
- **User Message:** "No objects selected. Select objects or export entire canvas."
- **Technical Message:** "selectedIds.length === 0 and scope === 'selection'"
- **Recovery Action:** "Select objects or change to 'Export All'"
- **Visual Treatment:** Inline in export modal
- **Preserve Input:** Yes
- **Severity:** Info

#### VALIDATION_FILE_TOO_LARGE
- **Code:** `file_too_large`
- **User Message:** "File size exceeds 10MB. Try reducing canvas size or resolution."
- **Technical Message:** "Export file size > 10MB"
- **Recovery Action:** "Reduce scale or canvas size"
- **Visual Treatment:** Modal overlay
- **Preserve Input:** Yes
- **Severity:** Error

#### VALIDATION_INVALID_COLOR
- **Code:** `invalid_color_format`
- **User Message:** "Invalid color format. Use hex (#000000) or rgb(0,0,0)."
- **Technical Message:** "Validation: !colorRegex.test(value)"
- **Recovery Action:** "Enter valid color"
- **Visual Treatment:** Inline below color input
- **Preserve Input:** Yes
- **Severity:** Error

---

## Error Handling Best Practices

### 1. User-Friendly Messages
- ✅ Use plain language (not technical jargon)
- ✅ Be specific ("Card declined" not "Payment failed")
- ✅ Explain impact ("You're offline. Changes will sync when you reconnect.")
- ❌ Don't blame user ("You entered wrong password" → "Incorrect password")

### 2. Recovery Paths
- ✅ Always provide next action ("Try different card", "Reset password")
- ✅ Include actionable buttons (Retry, Contact Support, Upgrade)
- ✅ Auto-recovery when possible (auto-retry on network restore)
- ❌ Don't dead-end users (always show escape hatch)

### 3. Visual Treatments
- **Inline:** Field-level errors (validation, form errors)
- **Banner:** Page-level errors (network, session)
- **Modal:** Critical errors requiring attention (payment failed, access denied)
- **Toast:** Non-critical info (slow connection, auto-save)
- **Full-page:** Fatal errors (404, 500, project not found)

### 4. Preserve User Input
- ✅ Keep form data on error (don't clear on validation fail)
- ✅ Highlight problematic fields (red border + message)
- ✅ Show what was entered (except sensitive data like passwords)
- ❌ Don't clear entire form on single field error

### 5. Error Severity Levels
- **Error (Red):** Action failed, user must intervene
- **Warning (Yellow):** Action succeeded with caveats
- **Info (Blue):** Informational, no action failed

---

## Implementation Notes

### Error State Component Pattern

```tsx
interface ErrorStateProps {
  error: ErrorCode;
  onRetry?: () => void;
  onDismiss?: () => void;
}

function ErrorState({ error, onRetry, onDismiss }: ErrorStateProps) {
  const errorConfig = ERROR_CATALOG[error];

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      errorConfig.severity === 'error' && "bg-red-50 border-red-200",
      errorConfig.severity === 'warning' && "bg-yellow-50 border-yellow-200",
      errorConfig.severity === 'info' && "bg-blue-50 border-blue-200"
    )}>
      <p className="text-sm font-medium">{errorConfig.userMessage}</p>
      {errorConfig.recovery && (
        <button onClick={onRetry} className="mt-2 text-sm underline">
          {errorConfig.recovery}
        </button>
      )}
    </div>
  );
}
```

### Real-Time Form Validation

```tsx
function PaymentForm() {
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});

  const validateCardNumber = (value: string) => {
    if (!isValidCardNumber(value)) {
      setErrors(prev => ({ ...prev, cardNumber: 'PAYMENT_INVALID_CARD' }));
    } else {
      setErrors(prev => {
        const { cardNumber, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <div>
      <input
        onBlur={(e) => validateCardNumber(e.target.value)}
        className={errors.cardNumber && "border-red-500"}
      />
      {errors.cardNumber && (
        <ErrorState error={errors.cardNumber} />
      )}
    </div>
  );
}
```

---

## Total Error Scenarios: 35

- **Authentication:** 8 scenarios
- **Payment:** 10 scenarios
- **Permission:** 5 scenarios
- **Network:** 4 scenarios
- **Validation:** 8 scenarios

**Next Steps:**
1. Create TypeScript error constants in `src/constants/errors.ts`
2. Implement error state components
3. Add error boundary for uncaught errors
4. Test all error scenarios manually
