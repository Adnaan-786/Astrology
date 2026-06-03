import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithEmail, loginWithEmail, loginWithGoogle } from "@/lib/authService";
import { Eye, EyeOff, Mail, Sparkles, Star, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// ================= EYE / PUPIL =================
const EyeBall = ({ size = 18, pupilSize = 7, maxDistance = 5, eyeColor = "white", pupilColor = "#2D2D2D", isBlinking = false, forceLookX, forceLookY }) => {
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { setMx(e.clientX); setMy(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  const calc = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const d = Math.min(Math.hypot(dx, dy), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  };
  const pos = calc();
  return (
    <div ref={ref} className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: "hidden" }}>
      {!isBlinking && (
        <div className="rounded-full"
          style={{ width: pupilSize, height: pupilSize, backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }} />
      )}
    </div>
  );
};

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "#2D2D2D", forceLookX, forceLookY }) => {
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { setMx(e.clientX); setMy(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  const calc = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const d = Math.min(Math.hypot(dx, dy), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  };
  const pos = calc();
  return (
    <div ref={ref} className="rounded-full"
      style={{ width: size, height: size, backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }} />
  );
};

// ================= AUTH PAGE =================
const AuthPage = ({ mode = "login" }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [look, setLook] = useState(false);
  const [peeking, setPeeking] = useState(false);

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  useEffect(() => {
    const h = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // blinks
  useEffect(() => {
    let tid;
    const run = () => {
      tid = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => { setIsPurpleBlinking(false); run(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    run();
    return () => clearTimeout(tid);
  }, []);
  useEffect(() => {
    let tid;
    const run = () => {
      tid = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => { setIsBlackBlinking(false); run(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    run();
    return () => clearTimeout(tid);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setLook(true);
      const t = setTimeout(() => setLook(false), 800);
      return () => clearTimeout(t);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setPeeking(true);
        setTimeout(() => setPeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    } else {
      setPeeking(false);
    }
  }, [password, showPassword, peeking]);

  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 3;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };
  const pp = calcPos(purpleRef);
  const bp = calcPos(blackRef);
  const yp = calcPos(yellowRef);
  const op = calcPos(orangeRef);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill all required fields");
      return;
    }
    if (authMode === "signup" && !name.trim()) {
      setError("Name is required");
      return;
    }
    if (authMode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      let result;
      if (authMode === "signup") {
        result = await registerWithEmail(email.trim(), password, name.trim());
      } else {
        result = await loginWithEmail(email.trim(), password);
      }

      toast.success(authMode === "signup" ? "Account created ✓" : "Welcome back ✓");
      navigate(result.redirect || "/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      toast.success("Welcome! ✓");
      navigate(result.redirect || "/dashboard");
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = authMode === "signup";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 av-bg" data-testid="auth-page">
      {/* LEFT - Animated Characters Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2D1B69 0%, #5B2FB4 50%, #8B5CF6 100%)" }}>
        <div className="relative z-20 flex items-center gap-2">
          <img src="/images/logo.png" alt="AstroVedic AI Logo" className="h-10 w-auto" />
        </div>

        <div className="relative z-20 flex items-end justify-center h-[460px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
            {/* Purple */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700"
              style={{ left: 70, width: 180, height: (isTyping || (password.length > 0 && !showPassword)) ? 440 : 400,
                backgroundColor: "#6C3FF5", borderRadius: "10px 10px 0 0", zIndex: 1,
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" :
                  (isTyping || (password.length > 0 && !showPassword))
                    ? `skewX(${pp.bodySkew - 12}deg) translateX(40px)`
                    : `skewX(${pp.bodySkew}deg)`,
                transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-8 transition-all duration-700"
                style={{ left: (password.length > 0 && showPassword) ? 20 : look ? 55 : 45 + pp.faceX,
                  top: (password.length > 0 && showPassword) ? 35 : look ? 65 : 40 + pp.faceY }}>
                <EyeBall isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (peeking ? 4 : -4) : look ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (peeking ? 5 : -4) : look ? 4 : undefined} />
                <EyeBall isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (peeking ? 4 : -4) : look ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (peeking ? 5 : -4) : look ? 4 : undefined} />
              </div>
            </div>

            {/* Black */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700"
              style={{ left: 240, width: 120, height: 310, backgroundColor: "#2D2D2D",
                borderRadius: "8px 8px 0 0", zIndex: 2,
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" :
                  look ? `skewX(${bp.bodySkew * 1.5 + 10}deg) translateX(20px)` :
                    (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${bp.bodySkew * 1.5}deg)` :
                      `skewX(${bp.bodySkew}deg)`,
                transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-6 transition-all duration-700"
                style={{ left: (password.length > 0 && showPassword) ? 10 : look ? 32 : 26 + bp.faceX,
                  top: (password.length > 0 && showPassword) ? 28 : look ? 12 : 32 + bp.faceY }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : look ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : look ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : look ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : look ? -4 : undefined} />
              </div>
            </div>

            {/* Orange */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700"
              style={{ left: 0, width: 240, height: 200, zIndex: 3, backgroundColor: "#FF9B6B",
                borderRadius: "120px 120px 0 0",
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" : `skewX(${op.bodySkew}deg)`,
                transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-8 transition-all duration-200"
                style={{ left: (password.length > 0 && showPassword) ? 50 : 82 + op.faceX,
                  top: (password.length > 0 && showPassword) ? 85 : 90 + op.faceY }}>
                <Pupil forceLookX={(password.length > 0 && showPassword) ? -5 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil forceLookX={(password.length > 0 && showPassword) ? -5 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700"
              style={{ left: 310, width: 140, height: 230, backgroundColor: "#E8D754",
                borderRadius: "70px 70px 0 0", zIndex: 4,
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" : `skewX(${yp.bodySkew}deg)`,
                transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-6 transition-all duration-200"
                style={{ left: (password.length > 0 && showPassword) ? 20 : 52 + yp.faceX,
                  top: (password.length > 0 && showPassword) ? 35 : 40 + yp.faceY }}>
                <Pupil forceLookX={(password.length > 0 && showPassword) ? -5 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil forceLookX={(password.length > 0 && showPassword) ? -5 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              <div className="absolute w-20 h-1 bg-[#2D2D2D] rounded-full transition-all duration-200"
                style={{ left: (password.length > 0 && showPassword) ? 10 : 40 + yp.faceX,
                  top: (password.length > 0 && showPassword) ? 88 : 88 + yp.faceY }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-white/70">
          <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-white">Terms of Service</Link>
          <a href="mailto:support@astrovedic.ai" className="hover:text-white">Contact</a>
        </div>

        <div className="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* RIGHT - Form */}
      <div className="flex items-center justify-center p-6 sm:p-8 av-bg">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <img src="/images/logo.png" alt="AstroVedic AI Logo" className="h-12 w-auto" />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-cinzel text-3xl font-bold tracking-tight mb-2 av-text">
              {isSignup ? "Create your account" : "Welcome back!"}
            </h1>
            <p className="av-text-2 text-sm">
              {isSignup ? "Start your cosmic journey today" : "Please enter your details"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium av-text">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                  <Input id="name" data-testid="auth-name-input" type="text" placeholder="Anna Sharma"
                    value={name} onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                    required className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium av-text">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                <Input id="email" data-testid="auth-email-input" type="email" placeholder="anna@gmail.com"
                  value={email} autoComplete="off" onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                  required className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium av-text">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                <Input id="password" data-testid="auth-password-input" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                  required className="h-12 pl-10 pr-10 av-surface av-card-border focus:border-[#D4A017]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} data-testid="auth-toggle-password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 av-text-3 hover:av-text">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSignup && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer av-text-2">Remember for 30 days</Label>
                </div>
                <a href="#" className="text-sm text-[#F5C842] hover:underline font-medium">Forgot password?</a>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg" data-testid="auth-error">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} data-testid="auth-submit-btn"
              className="w-full h-12 text-base font-semibold rounded-full bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] hover:shadow-lg hover:scale-[1.01] transition-all">
              {loading ? "Please wait..." : (isSignup ? "Create Account" : "Log in")}
            </Button>
          </form>

          <div className="mt-5">
            <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading}
              className="w-full h-12 av-surface av-card-border hover:border-[#D4A017] transition-all">
              <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="text-center text-sm av-text-2 mt-6">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button type="button" data-testid="auth-switch-mode"
              onClick={() => { setAuthMode(isSignup ? "login" : "signup"); setError(""); }}
              className="font-semibold av-text hover:underline">
              {isSignup ? "Log in" : "Sign Up"}
            </button>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-xs av-text-3 hover:av-text">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
