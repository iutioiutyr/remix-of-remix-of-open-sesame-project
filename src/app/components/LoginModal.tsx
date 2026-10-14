import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../store/auth'
import './LoginModal.css'

interface Plan { id: string; name: string; price: number; popular: boolean }

const plans: Plan[] = [
  { id: '1day', name: '1 Day', price: 2000, popular: false },
  { id: '2days', name: '2 Days', price: 5000, popular: true },
  { id: '1week', name: '1 Week', price: 10000, popular: false },
  { id: '2weeks', name: '2 Weeks', price: 15000, popular: false },
  { id: '1month', name: '1 Month', price: 25000, popular: false },
]

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'Email already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

export interface LoginModalProps {
  open: boolean
  onClose: () => void
  onLoggedIn: () => void
}

export default function LoginModal({ open, onClose, onLoggedIn }: LoginModalProps) {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth()

  const [step, setStep] = useState(1)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('2days')

  useEffect(() => {
    if (!open) {
      setStep(1)
      setIsRegister(false)
      setEmail('')
      setPassword('')
      setName('')
      setErrorMsg('')
      setLoading(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      if (isRegister) {
        await signUpEmail(email, password, name)
      } else {
        await signInEmail(email, password)
      }
      onLoggedIn()
      onClose()
    } catch (e: any) {
      setErrorMsg(friendlyError(e.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setErrorMsg('')
    setLoading(true)
    try {
      await signInGoogle()
      onLoggedIn()
      onClose()
    } catch (e: any) {
      setErrorMsg(friendlyError(e.code))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="vjs-LoginModal modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`modal-box${step === 2 ? ' modal-box--wide' : ''}`}>
        <button className="modal-close" onClick={onClose}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {step === 1 ? (
          <>
            <div className="modal-brand">
              <img src="/logo.png" alt="LUO NIGER" className="modal-logo" />
              <div className="brand-text-block">
                <span className="brand-name">LUO NIGER</span>
              </div>
            </div>
            <h2 className="modal-heading">{isRegister ? 'Create Account' : 'Sign in'}</h2>
            <p className="modal-sub">{isRegister ? 'Join to access downloads & subscription' : 'Access downloads & subscription'}</p>

            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <div className="divider"><span>or</span></div>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="field">
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Full name" className="field-input" required />
                </div>
              )}
              <div className="field">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="field-input" required />
              </div>
              <div className="field">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="field-input" required minLength={6} />
              </div>
              {errorMsg && <p className="err-msg">{errorMsg}</p>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Please wait...' : (isRegister ? 'CREATE ACCOUNT' : 'SIGN IN')}
              </button>
            </form>

            <p className="footer-note">
              {isRegister ? 'Already have an account?' : 'No account?'}{' '}
              <a href="#" className="link" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister) }}>
                {isRegister ? 'Sign in' : 'Register now'}
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="step2-top">
              <button className="back-btn" onClick={() => setStep(1)}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <div className="modal-brand" style={{ marginBottom: 0 }}>
                <img src="/logo.png" alt="LUO NIGER" className="modal-logo" />
                <div className="brand-text-block">
                  <span className="brand-name">LUO NIGER</span>
                </div>
              </div>
            </div>
            <h2 className="modal-heading" style={{ marginTop: 10 }}>Choose a Plan</h2>
            <p className="modal-sub">UGX · Access HD downloads</p>
            <div className="plans-grid">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-card${selectedPlan === plan.id ? ' selected' : ''}${plan.popular ? ' popular' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && <div className="popular-badge">BEST</div>}
                  <div className="plan-radio-row">
                    <div className={`plan-radio${selectedPlan === plan.id ? ' active' : ''}`}>
                      {selectedPlan === plan.id && <div className="plan-radio-dot"></div>}
                    </div>
                  </div>
                  <p className="plan-name">{plan.name}</p>
                  <div className="plan-price-block">
                    <span className="plan-price">{plan.price.toLocaleString()}</span>
                    <span className="plan-currency">UGX</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="subscribe-btn" onClick={onClose}>SUBSCRIBE</button>
            <p className="footer-note" style={{ marginTop: 10 }}>Secure payment · UGX</p>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
