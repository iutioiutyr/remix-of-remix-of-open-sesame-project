const BASE = '/api/public/pesapal'

function getSafeErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null

  const body = payload as Record<string, unknown>
  const candidates = [
    body.error_description,
    body.message,
    body.error,
    body.detail,
    body.description,
  ]

  for (const candidate of candidates) {
    const message = typeof candidate === 'string'
      ? candidate
      : candidate && typeof candidate === 'object' && !Array.isArray(candidate)
        ? String(
            (candidate as Record<string, unknown>).message
            || (candidate as Record<string, unknown>).description
            || (candidate as Record<string, unknown>).code
            || ''
          )
        : ''
    const cleaned = message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (
      cleaned
      && !/(consumer.{0,12}(?:key|secret)|access.?token|authorization\s*:\s*bearer)/i.test(cleaned)
    ) {
      return cleaned.slice(0, 180)
    }
  }

  return null
}

async function requestPesapalJson(
  url: string,
  init: RequestInit,
  action: string
): Promise<Record<string, unknown>> {
  let response: Response
  let responseText: string

  try {
    response = await fetch(url, init)
    responseText = await response.text()
  } catch {
    throw new Error(`Could not reach PesaPal while ${action}. Check the site's payment API configuration and try again.`)
  }

  let payload: unknown
  try {
    payload = JSON.parse(responseText)
  } catch {
    payload = null
  }

  const providerMessage = getSafeErrorMessage(payload)
  if (!response.ok) {
    console.error(`[PesaPal] ${action} failed`, {
      status: response.status,
      message: providerMessage || 'No safe provider message was returned.',
    })
    throw new Error(
      `PesaPal ${action} failed (HTTP ${response.status})${providerMessage ? `: ${providerMessage}` : '.'}`
    )
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`PesaPal ${action} returned an invalid response (HTTP ${response.status}).`)
  }

  return payload as Record<string, unknown>
}

export interface PesapalOrder {
  orderTrackingId: string
  merchantReference: string
  redirectUrl: string
}

export interface PesapalStatus {
  statusCode: number
  description: string
  paymentMethod: string
  confirmationCode: string
  paymentAccount: string
  amount: number
}

export async function pesapalGetToken(): Promise<string> {
  const data = await requestPesapalJson(`${BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({}),
  }, 'authentication')

  if (typeof data.token !== 'string' || !data.token) {
    throw new Error('PesaPal authentication response did not include a token.')
  }
  return data.token
}

export async function pesapalRegisterIPN(token: string, ipnUrl: string): Promise<string> {
  const data = await requestPesapalJson(`${BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' }),
  }, 'notification registration')

  if (typeof data.ipn_id !== 'string' || !data.ipn_id) {
    throw new Error('PesaPal notification registration response did not include an IPN ID.')
  }
  return data.ipn_id
}

export async function pesapalSubmitOrder(
  token: string,
  ipnId: string,
  params: {
    amount: number
    description: string
    email: string
    phone: string
    firstName: string
    lastName?: string
    callbackUrl: string
    cancellationUrl: string
  }
): Promise<PesapalOrder> {
  const merchantReference = `VJONEFLEX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  const data = await requestPesapalJson(`${BASE}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      id: merchantReference,
      currency: 'UGX',
      amount: params.amount,
      description: params.description,
      callback_url: params.callbackUrl,
      cancellation_url: params.cancellationUrl,
      redirect_mode: 'PARENT_WINDOW',
      notification_id: ipnId,
      billing_address: {
        email_address: params.email || '',
        phone_number: params.phone || '',
        country_code: 'UG',
        first_name: params.firstName || 'Customer',
        last_name: params.lastName || '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: '',
      },
    }),
  }, 'payment order creation')

  if (
    typeof data.order_tracking_id !== 'string'
    || !data.order_tracking_id
    || typeof data.redirect_url !== 'string'
    || !data.redirect_url
  ) {
    throw new Error('PesaPal did not return a payment link for the new order. Check your Pesapal dashboard before retrying.')
  }

  return {
    orderTrackingId: data.order_tracking_id,
    merchantReference: typeof data.merchant_reference === 'string' ? data.merchant_reference : merchantReference,
    redirectUrl: data.redirect_url,
  }
}

export async function pesapalGetStatus(token: string, orderTrackingId: string): Promise<PesapalStatus | null> {
  try {
    const res = await fetch(
      `${BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    )
    const data = await res.json()
    let statusCode = -1
    if (typeof data.status_code === 'number') statusCode = data.status_code
    else if (typeof data.status_code === 'string') statusCode = parseInt(data.status_code, 10) || -1
    const desc = (data.payment_status_description || '').toLowerCase()
    if (statusCode === -1) {
      if (desc === 'completed') statusCode = 1
      else if (desc === 'failed') statusCode = 2
      else if (desc === 'reversed') statusCode = 3
    }
    return {
      statusCode,
      description: data.payment_status_description || '',
      paymentMethod: data.payment_method || '',
      confirmationCode: data.confirmation_code || '',
      paymentAccount: data.payment_account || '',
      amount: data.amount || 0,
    }
  } catch {
    return null
  }
}
