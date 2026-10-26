import React, { useState, useContext, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { GoogleLogin } from "@react-oauth/google";
import { Separator } from "@/components/ui/separator";
import api, { setAccessToken } from "@/api";
import { StickyBar } from "@/components/StickyBanner";

const FACTS = [
  {
    kicker: "Did you know?",
    text: "The first hostel opened in 1909 in Altena, Germany — a schoolteacher turned his classrooms into simple beds for travelers.",
  },
  {
    kicker: "Fun fact",
    text: "There are over 30,000 hostels worldwide. From treehouses in Costa Rica to converted prisons in Slovenia.",
  },
  {
    kicker: "Travel tip",
    text: "Book hostel dorms with a locker and a reading light. Small things, huge difference after a long bus ride.",
  },
  {
    kicker: "Tribe wisdom",
    text: "The best travel stories start in a hostel kitchen at 2 AM, not on a tour bus.",
  },
  {
    kicker: "Did you know?",
    text: "Hostel guests collectively save over $1 billion a year by cooking in shared kitchens instead of eating out.",
  },
  {
    kicker: "Travel tip",
    text: "The cheapest beds sell out 3–4 weeks ahead. If you're flexible on dates, mid-week is always cheaper.",
  },
  {
    kicker: "Fun fact",
    text: "Japan has 'capsule hotels' — the spiritual cousin of hostels. The first one opened in Osaka in 1979.",
  },
  {
    kicker: "Tribe wisdom",
    text: "Say yes to the stranger who invites you to dinner. That's how tribes form.",
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

const passwordChecks = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /\d/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

/* Pill input with a leading icon. Placeholder carries the label. */
function PillInput({
  icon: Icon,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  rightSlot,
  autoComplete,
  inputMode,
  maxLength,
  pattern,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        className={`pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
          error
            ? "text-destructive"
            : focused
              ? "text-primary"
              : "text-ink-muted"
        }`}
      />
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        className={`rounded-full pl-12 ${rightSlot ? "pr-12" : "pr-5"} ${
          error ? "border-destructive focus-visible:ring-destructive/40" : ""
        }`}
        aria-invalid={!!error}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        required
      />
      {rightSlot}
    </div>
  );
}

const Login = () => {
  const { login, signupUser, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  const [factIndex] = useState(() => Math.floor(Math.random() * FACTS.length));
  const currentFact = FACTS[factIndex];

  const wavePath = useMemo(() => {
    const crests = 4 + Math.floor(Math.random() * 3);
    const segHeight = 1440 / crests;
    let d = "M140,0 ";
    for (let i = 0; i < crests; i++) {
      const y1 = Math.round(segHeight * i + segHeight * 0.3);
      const y2 = Math.round(segHeight * i + segHeight * 0.7);
      const y3 = Math.round(segHeight * (i + 1));
      const x1 = 40 + Math.floor(Math.random() * 40);
      const x2 = 160 + Math.floor(Math.random() * 40);
      const x3 = 100 + Math.floor(Math.random() * 60);
      d += `C${x1},${y1} ${x2},${y2} ${x3},${y3} `;
    }
    d += "L200,1440 L200,0 Z";
    return d;
  }, []);

  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    name: false,
    phone: false,
  });

  const [displayName, setDisplayName] = useState("");
  const debounceTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDisplayName(value.trim());
      }, 300);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const emailError =
    touched.email && data.email.length > 0 && !EMAIL_RE.test(data.email.trim())
      ? "Enter a valid email address"
      : touched.email && data.email.length === 0
        ? "Email is required"
        : "";

  const pwChecks = passwordChecks(data.password);
  const pwAllValid = Object.values(pwChecks).every(Boolean);
  const passwordError =
    touched.password && data.password.length > 0 && !pwAllValid
      ? "Password doesn't meet all requirements"
      : touched.password && data.password.length === 0
        ? "Password is required"
        : "";

  const nameError =
    touched.name && data.name.trim().length < 2
      ? "Please enter your full name"
      : "";

  const phoneError =
    touched.phone && data.phone.length > 0 && !PHONE_RE.test(data.phone)
      ? "Phone must be exactly 10 digits"
      : touched.phone && data.phone.length === 0
        ? "Phone is required"
        : "";

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setError("");

    const signupValid =
      EMAIL_RE.test(data.email.trim()) &&
      pwAllValid &&
      data.name.trim().length >= 2 &&
      PHONE_RE.test(data.phone);
    const loginValid =
      EMAIL_RE.test(data.email.trim()) && data.password.length > 0;

    if (type === "signup") {
      if (!signupValid) {
        setTouched({ email: true, password: true, name: true, phone: true });
        return;
      }
    } else {
      if (!loginValid) {
        setTouched({ email: true, password: true });
        return;
      }
    }

    setLoading(true);

    try {
      if (type === "signup") {
        await signupUser(data);
        toast({
          title: "Sign up successful",
          description: `Welcome ${data.name}`,
          icon: <CheckCircle className="text-green-500" />,
        });
        setActiveTab("login");
        return;
      }

      await login(data.email, data.password);
      toast({
        title: "Login successful",
        description: "You are now logged in",
        icon: <CheckCircle className="text-green-500" />,
      });
      navigate("/");
    } catch (err) {
      console.error(err);
      
      const errMessage = [
        { key: 409, val: "User already exists" },
        { key: 404, val: "User not found, please signup!" },
        { key: 400, val: "Invalid credentials" }
      ];
      
      const matchedError = errMessage.find(e => e.key === err.response?.status);
      
      const displayMessage = matchedError?.val || "Internal Error";

      setError(displayMessage);
      toast({
        title: "Authentication failed",
        description: displayMessage,
        variant: "destructive",
        icon: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const googleLoginEnabled = import.meta.env.VITE_GOOGLE_CLIENT_ID !== "";

  const showNameGreeting = activeTab === "signup" && displayName.length > 0;
  const greeting = showNameGreeting ? `Hi, ${displayName}.` : "Hi, traveler.";

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted transition hover:bg-primary/10 hover:text-primary"
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-paper text-ink lg:flex-row">
      <StickyBar />
      <Toaster />

      {/* ==================== LEFT ==================== */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-primary lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--on-primary)) 1.2px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-center p-12 xl:p-16">
          <div className="max-w-lg">
            <div
              className="relative overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, black 0, black calc(100% - 48px), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, black 0, black calc(100% - 48px), transparent 100%)",
              }}
            >
              <h1
                className="whitespace-nowrap text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.04em] text-on-primary xl:text-[3.5rem]"
                title={greeting}
              >
                {greeting}
              </h1>
            </div>

            <div className="mt-14">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent">
                  {currentFact.kicker}
                </span>
              </div>

              <p className="mt-6 text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.02em] text-on-primary xl:text-[1.75rem] xl:leading-[1.25]">
                {currentFact.text}
              </p>
            </div>

            <p className="mt-10 max-w-sm text-sm font-light leading-[1.6] text-on-primary/70 xl:text-base">
              Book hostel stays that feel like home — with people who get it.
            </p>
          </div>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 200 1440"
          preserveAspectRatio="none"
          shapeRendering="geometricPrecision"
          className="absolute -right-px top-0 h-full w-16 xl:w-24 text-paper"
        >
          <path fill="currentColor" d={wavePath} />
        </svg>
      </aside>

      {/*  RIGHT  */}
      <section className="relative flex w-full flex-1 items-center justify-center overflow-y-auto bg-paper px-5 py-8 sm:px-8 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md pt-16 lg:pt-0">
          <Card className="rounded-3xl border border-hairline bg-white shadow-[0_20px_60px_-15px_var(--card-shadow-hover)]">
            <CardContent className="p-6 sm:p-7">
              <div className="space-y-1 text-center">
                <h2 className="pacifico-regular text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  Travel Tribe
                </h2>
                <p className="text-xs text-ink-muted sm:text-sm">
                  Welcome back. Let&apos;s get you in.
                </p>
              </div>

              <div className="mt-4 flex justify-center">
                {googleLoginEnabled ? (
                  <div className="w-full [&>div]:!w-full [&>div>div]:!rounded-full [&>div>div]:!overflow-hidden">
                    <GoogleLogin
                      useOneTap={true}
                      width="100%"
                      shape="pill"
                      onSuccess={async (credentialResponse) => {
                        try {
                          const res = await api.post(
                            "/api/user/google/callback",
                            { token: credentialResponse.credential },
                          );

                          const returnedUser = res.data.user;
                          const accessToken = res.data.accessToken;

                          setAccessToken(accessToken);
                          setUser(returnedUser);
                          localStorage.setItem(
                            "user",
                            JSON.stringify(returnedUser),
                          );

                          toast({ title: "Login successful" });
                          navigate("/");
                        } catch (googleErr) {
                          // console.log("Google Error",googleErr.status)
                          toast({
                            title: "Google login failed",
                            description:
                              googleErr.status === 429
                                ? "Rate Limit exceed wait few minute"
                                : "",
                            variant: "destructive",
                          });
                        }
                      }}
                      onError={(e) => {
                        toast({
                          title: "Google login failed",
                          description: e?.message || "",
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                ) : (
                  <Button disabled className="w-full rounded-full">
                    Google login disabled
                  </Button>
                )}
              </div>

              <div className="my-3.5 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                  or
                </span>
                <Separator className="flex-1" />
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v);
                  setError("");
                  setTouched({
                    email: false,
                    password: false,
                    name: false,
                    phone: false,
                  });
                }}
                className="w-full"
              >
                <TabsList className="mb-4 grid grid-cols-2 rounded-full bg-primary/10 p-1 ">
                  <TabsTrigger
                    value="login"
                    className="rounded-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    Log in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    Sign up
                  </TabsTrigger>
                </TabsList>

                {/* ==================== LOGIN ==================== */}
                <TabsContent value="login">
                  {error && (
                    <Alert variant="destructive" className="mb-3 rounded-full">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form
                    onSubmit={(e) => handleAuth(e, "login")}
                    className="space-y-3"
                    noValidate
                  >
                    <div>
                      <Label htmlFor="login-email" className="sr-only">
                        Email
                      </Label>
                      <PillInput
                        id="login-email"
                        icon={Mail}
                        name="email"
                        type="email"
                        value={data.email}
                        onChange={handleDataChange}
                        onBlur={handleBlur}
                        placeholder="Email"
                        error={emailError}
                        autoComplete="email"
                      />
                      {emailError && (
                        <p className="mt-1 pl-4 text-xs text-destructive">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="mb-1 flex justify-end">
                        <Link
                          to={`/forgot-password${
                            data?.email ? `?email=${data.email}` : ""
                          }`}
                          className="text-xs font-medium text-accent-ink hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Label htmlFor="login-password" className="sr-only">
                        Password
                      </Label>
                      <PillInput
                        id="login-password"
                        icon={Lock}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={data.password}
                        onChange={handleDataChange}
                        onBlur={handleBlur}
                        placeholder="Password"
                        rightSlot={passwordToggle}
                        autoComplete="current-password"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-primary text-on-primary shadow-md transition hover:bg-primary-hover"
                    >
                      {loading ? "Signing in..." : "Log in"}
                    </Button>
                  </form>
                </TabsContent>

                {/* ==================== SIGNUP ==================== */}
                <TabsContent value="signup">
                  {error && (
                    <Alert variant="destructive" className="mb-3 rounded-full">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form
                    onSubmit={(e) => handleAuth(e, "signup")}
                    className="space-y-3"
                    noValidate
                  >
                    <div>
                      <Label htmlFor="signup-name" className="sr-only">
                        Full name
                      </Label>
                      <PillInput
                        id="signup-name"
                        icon={User}
                        name="name"
                        value={data.name}
                        onChange={handleDataChange}
                        onBlur={handleBlur}
                        placeholder="Full name"
                        error={nameError}
                        autoComplete="name"
                      />
                      {nameError && (
                        <p className="mt-1 pl-4 text-xs text-destructive">
                          {nameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="signup-email" className="sr-only">
                        Email
                      </Label>
                      <PillInput
                        id="signup-email"
                        icon={Mail}
                        name="email"
                        type="email"
                        value={data.email}
                        onChange={handleDataChange}
                        onBlur={handleBlur}
                        placeholder="Email"
                        error={emailError}
                        autoComplete="email"
                      />
                      {emailError && (
                        <p className="mt-1 pl-4 text-xs text-destructive">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="signup-phone" className="sr-only">
                        Phone
                      </Label>
                      <PillInput
                        id="signup-phone"
                        icon={Phone}
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="\d{10}"
                        maxLength={10}
                        value={data.phone}
                        onChange={handleDataChange}
                        onBlur={handleBlur}
                        placeholder="Phone"
                        error={phoneError}
                        autoComplete="tel"
                      />
                      {phoneError && (
                        <p className="mt-1 pl-4 text-xs text-destructive">
                          {phoneError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="signup-password" className="sr-only">
                        Password
                      </Label>
                      <PillInput
                        id="signup-password"
                        icon={Lock}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={data.password}
                        onChange={handleDataChange}
                        onBlur={handleBlur}
                        placeholder="Password"
                        error={passwordError}
                        rightSlot={passwordToggle}
                        autoComplete="new-password"
                      />

                      {data.password.length > 0 && (
                        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 pl-4">
                          <CheckItem label="8+ chars" ok={pwChecks.length} />
                          <CheckItem label="Uppercase" ok={pwChecks.upper} />
                          <CheckItem label="Lowercase" ok={pwChecks.lower} />
                          <CheckItem label="Number" ok={pwChecks.number} />
                          <CheckItem
                            label="Special char"
                            ok={pwChecks.special}
                          />
                        </ul>
                      )}

                      {passwordError && (
                        <p className="mt-1 pl-4 text-xs text-destructive">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-primary text-on-primary shadow-md transition hover:bg-primary-hover"
                    >
                      {loading ? "Creating account..." : "Sign up"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

function CheckItem({ label, ok }) {
  return (
    <li
      className={`flex items-center gap-1.5 text-[0.7rem] transition ${
        ok ? "text-emerald-600" : "text-ink-muted"
      }`}
    >
      <span
        className={`inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-[0.6rem] ${
          ok
            ? "bg-emerald-500 text-white"
            : "bg-border-strong/50 text-transparent"
        }`}
      >
        ✓
      </span>
      <span>{label}</span>
    </li>
  );
}

export default Login;
