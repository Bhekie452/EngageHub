/**
 * PayFast Payment Gateway Integration
 * Documentation: https://developers.payfast.co.za/
 */

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number?: string;
  m_payment_id: string; // Unique payment ID
  amount: string; // Amount in ZAR (format: "549.00")
  item_name: string; // Plan name
  item_description?: string;
  subscription_type?: number; // 1 = subscription, 0 = one-time
  billing_date?: string; // YYYY-MM-DD for subscriptions
  recurring_amount?: string;
  frequency?: string; // "M" for monthly
  cycles?: number; // 0 = indefinite
  custom_str1?: string; // User ID
  custom_str2?: string; // Workspace ID
  custom_str3?: string; // Plan tier
  custom_str4?: string; // Trial days
  custom_str5?: string; // Additional metadata
}

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passPhrase?: string; // For secure signature
  sandbox?: boolean;
}

// Lightweight MD5 implementation (to avoid external dependency)
// Adapted for TypeScript usage.
function md5(str: string): string {
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = (((a + q) | 0) + ((x + t) | 0)) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function toWordArray(input: string) {
    const msgLength = input.length;
    const n = (((msgLength + 8) >>> 6) + 1) * 16;
    const buffer = new Array<number>(n).fill(0);
    let i: number;
    for (i = 0; i < msgLength; i++) {
      buffer[i >> 2] |= (input.charCodeAt(i) & 0xff) << ((i % 4) * 8);
    }
    buffer[i >> 2] |= 0x80 << ((i % 4) * 8);
    buffer[n - 2] = msgLength * 8;
    return buffer;
  }
  function toHex(num: number) {
    let hex = '';
    for (let j = 0; j < 4; j++) {
      hex += ('0' + ((num >> (j * 8)) & 0xff).toString(16)).slice(-2);
    }
    return hex;
  }

  const x = toWordArray(str);
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063);
    b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = hh(a, b, c, d, x[i + 5], 4, -378558);
    d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = (a + oa) | 0;
    b = (b + ob) | 0;
    c = (c + oc) | 0;
    d = (d + od) | 0;
  }

  return toHex(a) + toHex(b) + toHex(c) + toHex(d);
}

/**
 * Get PayFast configuration from environment variables
 */
export const getPayFastConfig = (): PayFastConfig => {
  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID || '';
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || '';
  const passPhrase = import.meta.env.VITE_PAYFAST_PASSPHRASE || '';
  const sandbox = import.meta.env.VITE_PAYFAST_SANDBOX === 'true' || !merchantId;

  if (!merchantId || !merchantKey) {
    console.warn('PayFast credentials not configured. Using sandbox mode.');
  }

  return {
    merchantId,
    merchantKey,
    passPhrase,
    sandbox,
  };
};

/**
 * Generate PayFast signature for payment data
 * PayFast uses MD5 hash of all parameters in alphabetical order
 */
export const generatePayFastSignature = (
  data: Record<string, string>,
  passPhrase?: string
): string => {
  // Remove empty values and signature field
  const filteredData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && key !== 'signature') {
      filteredData[key] = value;
    }
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(filteredData).sort();

  // Build query string
  let queryString = '';
  for (const key of sortedKeys) {
    queryString += `${key}=${encodeURIComponent(filteredData[key]).replace(/%20/g, '+')}&`;
  }
  queryString = queryString.slice(0, -1); // Remove trailing &

  // Add passphrase if provided
  if (passPhrase) {
    queryString += `&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, '+')}`;
  }

  // Generate MD5 hash
  const signature = CryptoJS.MD5(queryString).toString().toLowerCase();
  return signature;
};

/**
 * Build PayFast payment data object
 */
export const buildPayFastPaymentData = (
  config: PayFastConfig,
  paymentData: Partial<PayFastPaymentData>
): PayFastPaymentData => {
  const data: PayFastPaymentData = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: paymentData.return_url || `${window.location.origin}/payment/success`,
    cancel_url: paymentData.cancel_url || `${window.location.origin}/payment/cancel`,
    notify_url: paymentData.notify_url || `${window.location.origin}/api/payfast/notify`,
    name_first: paymentData.name_first || '',
    name_last: paymentData.name_last || '',
    email_address: paymentData.email_address || '',
    cell_number: paymentData.cell_number || '',
    m_payment_id: paymentData.m_payment_id || '',
    amount: paymentData.amount || '0.00',
    item_name: paymentData.item_name || '',
    item_description: paymentData.item_description,
    subscription_type: paymentData.subscription_type || 0,
    billing_date: paymentData.billing_date,
    recurring_amount: paymentData.recurring_amount,
    frequency: paymentData.frequency,
    cycles: paymentData.cycles,
    custom_str1: paymentData.custom_str1,
    custom_str2: paymentData.custom_str2,
    custom_str3: paymentData.custom_str3,
    custom_str4: paymentData.custom_str4,
    custom_str5: paymentData.custom_str5,
  };

  // Generate signature
  const signature = generatePayFastSignature(data, config.passPhrase);
  (data as any).signature = signature;

  return data;
};

/**
 * Create PayFast payment form and submit
 */
export const submitPayFastPayment = (paymentData: PayFastPaymentData): void => {
  const isSandbox = paymentData.merchant_id === '10000100' || paymentData.merchant_id === '10005631';
  const baseUrl = isSandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';

  // Create form
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = baseUrl;
  form.style.display = 'none';

  // Add all fields
  for (const [key, value] of Object.entries(paymentData)) {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  }

  // Add signature
  const signatureInput = document.createElement('input');
  signatureInput.type = 'hidden';
  signatureInput.name = 'signature';
  signatureInput.value = (paymentData as any).signature || '';
  form.appendChild(signatureInput);

  // Submit form
  document.body.appendChild(form);
  form.submit();
};

/**
 * Plan configuration
 */
export interface PlanConfig {
  tier: 'starter' | 'professional' | 'business';
  name: string;
  price: number; // In ZAR
  monthlyPosts: number;
  crmContacts: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    price: 549,
    monthlyPosts: 50,
    crmContacts: 1000,
    features: [
      'Unlimited Users',
      'Unlimited Social Accounts',
      '50 AI-Enhanced Posts/mo',
      '1,000 CRM Contacts',
      'Unified Inbox Access',
      'Basic Analytics',
      'Email Support',
    ],
  },
  professional: {
    tier: 'professional',
    name: 'Professional',
    price: 1499,
    monthlyPosts: 250,
    crmContacts: 10000,
    features: [
      'Unlimited Users',
      'Unlimited Social Accounts',
      '250 AI-Enhanced Posts/mo',
      '10,000 CRM Contacts',
      'Unified Inbox Access',
      'Priority Support & Reports',
      'Advanced Analytics',
      'AI Content Assistant',
    ],
  },
  business: {
    tier: 'business',
    name: 'Business',
    price: 2849,
    monthlyPosts: 1000,
    crmContacts: 100000,
    features: [
      'Unlimited Users',
      'Unlimited Social Accounts',
      '1,000 AI-Enhanced Posts/mo',
      '100,000 CRM Contacts',
      'Unified Inbox Access',
      'White-label & Dedicated Manager',
      'Custom Analytics & Dashboards',
      'Advanced AI Features',
      'Marketing Automation',
    ],
  },
};

/**
 * Create payment data for a subscription plan
 */
export const createSubscriptionPayment = (
  planTier: string,
  user: {
    id: string;
    email: string;
    full_name?: string;
    workspace_id?: string;
  },
  trialDays: number = 14
): PayFastPaymentData => {
  const config = getPayFastConfig();
  const plan = PLAN_CONFIGS[planTier.toLowerCase()];

  if (!plan) {
    throw new Error(`Invalid plan tier: ${planTier}`);
  }

  // Parse user name
  const nameParts = (user.full_name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Calculate billing date (after trial period)
  const billingDate = new Date();
  billingDate.setDate(billingDate.getDate() + trialDays);
  const billingDateStr = billingDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Generate unique payment ID
  const paymentId = `EH-${user.id.substring(0, 8)}-${Date.now()}`;

  return buildPayFastPaymentData(config, {
    name_first: firstName,
    name_last: lastName,
    email_address: user.email,
    m_payment_id: paymentId,
    amount: plan.price.toFixed(2),
    item_name: `${plan.name} Plan - EngageHub`,
    item_description: `Monthly subscription: ${plan.monthlyPosts} AI posts, ${plan.crmContacts.toLocaleString()} CRM contacts`,
    subscription_type: 1, // Subscription
    billing_date: billingDateStr,
    recurring_amount: plan.price.toFixed(2),
    frequency: 'M', // Monthly
    cycles: 0, // Indefinite
    custom_str1: user.id,
    custom_str2: user.workspace_id || '',
    custom_str3: plan.tier,
    custom_str4: trialDays.toString(),
    custom_str5: JSON.stringify({
      monthlyPosts: plan.monthlyPosts,
      crmContacts: plan.crmContacts,
    }),
  });
};
