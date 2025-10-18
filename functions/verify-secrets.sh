#!/bin/bash

# Stripe Functions Secret Verification Script
# Verifies all required secrets are configured correctly

echo "🔍 Verifying Firebase Secrets Configuration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not installed${NC}"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI installed${NC}"
echo ""

# Function to check secret
check_secret() {
    local secret_name=$1
    local expected_prefix=$2

    echo "Checking $secret_name..."

    # Try to access secret
    local secret_value=$(firebase functions:secrets:access "$secret_name" 2>&1)
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}❌ $secret_name is NOT set${NC}"
        echo "   Set with: firebase functions:secrets:set $secret_name"
        return 1
    fi

    # Check if value starts with expected prefix
    if [[ $secret_value == $expected_prefix* ]]; then
        echo -e "${GREEN}✅ $secret_name is set correctly${NC}"
        echo "   Prefix: ${secret_value:0:10}..."
        return 0
    else
        echo -e "${YELLOW}⚠️  $secret_name is set but may be wrong format${NC}"
        echo "   Expected prefix: $expected_prefix"
        echo "   Got prefix: ${secret_value:0:10}..."
        return 2
    fi
}

# Check STRIPE_SECRET_KEY
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_secret "STRIPE_SECRET_KEY" "sk_"
stripe_key_status=$?
echo ""

# Check STRIPE_WEBHOOK_SECRET
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_secret "STRIPE_WEBHOOK_SECRET" "whsec_"
webhook_secret_status=$?
echo ""

# Check OPENAI_API_KEY (optional, but nice to verify)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_secret "OPENAI_API_KEY" "sk-"
openai_key_status=$?
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $stripe_key_status -eq 0 ] && [ $webhook_secret_status -eq 0 ]; then
    echo -e "${GREEN}✅ All Stripe secrets are configured correctly!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. cd functions && npm run build"
    echo "  2. npm run deploy"
    echo "  3. Test checkout in Stripe test mode"
    echo ""
    exit 0
elif [ $stripe_key_status -eq 1 ] || [ $webhook_secret_status -eq 1 ]; then
    echo -e "${RED}❌ Some secrets are missing!${NC}"
    echo ""
    echo "Set missing secrets:"
    [ $stripe_key_status -eq 1 ] && echo "  firebase functions:secrets:set STRIPE_SECRET_KEY"
    [ $webhook_secret_status -eq 1 ] && echo "  firebase functions:secrets:set STRIPE_WEBHOOK_SECRET"
    echo ""
    echo "Get values from:"
    echo "  - STRIPE_SECRET_KEY: Stripe Dashboard → API keys → Secret key"
    echo "  - STRIPE_WEBHOOK_SECRET: Stripe Dashboard → Webhooks → Signing secret"
    echo ""
    exit 1
else
    echo -e "${YELLOW}⚠️  Secrets are set but may have wrong format${NC}"
    echo ""
    echo "Verify secrets are correct:"
    [ $stripe_key_status -eq 2 ] && echo "  - STRIPE_SECRET_KEY should start with sk_test_ or sk_live_"
    [ $webhook_secret_status -eq 2 ] && echo "  - STRIPE_WEBHOOK_SECRET should start with whsec_"
    echo ""
    echo "If incorrect, update with:"
    echo "  firebase functions:secrets:set STRIPE_SECRET_KEY"
    echo "  firebase functions:secrets:set STRIPE_WEBHOOK_SECRET"
    echo ""
    exit 2
fi
