import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/api";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";

function PillInput({
  id,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  rightSlot,
  autoComplete,
  inputMode,
  maxLength,
  error,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
          error
            ? "text-destructive"
            : focused
              ? "text-primary"
              : "text-ink-muted"
        }`}
      />
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`h-11 rounded-full pl-11 ${
          rightSlot ? "pr-11" : "pr-4"
        } ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required
      />
      {rightSlot}
    </div>
  );
}

function OtpInput({ value, onChange, onComplete }) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const setDigit = (i, d) => {
    const arr = value.padEnd(6, " ").slice(0, 6).split("");
    arr[i] = d;
    const next = arr.join("").replace(/\s/g, "");
    onChange(next);
    return next;
  };

  const handleChange = (i) => (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(i, " ");
      return;
    }
    if (raw.length > 1) {
      const next = raw.slice(0, 6);
      onChange(next);
      inputsRef.current[Math.min(next.length, 5)]?.focus();
      if (next.length === 6) onComplete?.(next);
      return;
    }
    const next = setDigit(i, raw);
    if (i < 5) inputsRef.current[i + 1]?.focus();
    if (next.length === 6) onComplete?.(next);
  };

  const handleKeyDown = (i) => (e) => {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  };

  return (
    <div className="flex justify-between gap-1.5 sm:gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[i].trim()}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-full min-w-0 rounded-2xl border border-input bg-transparent text-center text-lg font-semibold text-ink shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      ))}
    </div>
  );
}

function StepNumber({ value, state }) {
  const front =
    state === "active"
      ? "text-primary opacity-100"
      : "text-ink-muted opacity-35";
  const back =
    state === "active"
      ? "text-accent opacity-100"
      : "text-border-strong opacity-20";

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-[4px] top-[4px] select-none font-semibold leading-none tracking-[-0.08em] transition-opacity duration-300 ${back}`}
        style={{ fontSize: "clamp(2.25rem, 6vw, 3.25rem)" }}
      >
        {value}
      </span>
      <span
        className={`relative select-none font-semibold leading-none tracking-[-0.08em] transition-opacity duration-300 ${front}`}
        style={{ fontSize: "clamp(2.25rem, 6vw, 3.25rem)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const e = searchParams.get("email");
    if (e) setEmail(e.toLowerCase().trim());
  }, []);

  const steps = [
    { n: "01", label: "Email", desc: "Where we send the code" },
    { n: "02", label: "Verify", desc: "Enter the 6-digit OTP" },
    { n: "03", label: "New password", desc: "Pick something strong" },
  ];

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/user/forgot-password", { email });
      toast({
        title: "OTP sent!",
        description:
          res.data.message || "Check your email for the 6-digit OTP.",
      });
      setStep(2);
    } catch (err) {
      toast({
        title: "Failed to send OTP",
        description:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e, otpOverride) => {
    e?.preventDefault?.();
    const code = otpOverride ?? otp;
    if (!code || code.trim().length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/user/verify-otp", { email, otp: code });
      toast({
        title: "Verified!",
        description: res.data.message || "OTP verified successfully.",
      });
      setStep(3);
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err.response?.data?.message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/user/reset-password", {
        email,
        otp,
        newPassword,
      });
      toast({
        title: "Success!",
        description: res.data.message || "Password reset successful.",
      });
      navigate("/login");
    } catch (err) {
      toast({
        title: "Reset failed",
        description:
          err.response?.data?.message ||
          "Could not reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const newPasswordToggle = (
    <button
      type="button"
      onClick={() => setShowNewPassword((s) => !s)}
      aria-label={showNewPassword ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted transition hover:bg-primary/10 hover:text-primary"
    >
      {showNewPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );

  const confirmPasswordToggle = (
    <button
      type="button"
      onClick={() => setShowConfirmPassword((s) => !s)}
      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted transition hover:bg-primary/10 hover:text-primary"
    >
      {showConfirmPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );

  const activeStep = steps[step - 1];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink">
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <Header />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary) / 0.22) 1.3px, transparent 1.4px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 45%, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 45%, black 0%, black 55%, transparent 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(600px circle at 0% 0%, hsl(var(--primary) / 0.06), transparent 60%), radial-gradient(600px circle at 100% 100%, hsl(var(--accent) / 0.08), transparent 60%)",
        }}
      />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-5 pb-32 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-36">
        <div className="w-full max-w-sm lg:hidden">
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-ink-muted">
              Account recovery
            </span>
          </div>

          <div className="mb-8 flex flex-col items-center text-center">
            <StepNumber value={activeStep.n} state="active" />
            <p className="mt-4 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent-ink">
              Step {step} of 3
            </p>
            <h1 className="mt-2 text-[1.7rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
              {activeStep.label}
            </h1>
            <p className="mt-1.5 text-[0.85rem] font-light text-ink-muted">
              {activeStep.desc}
            </p>
          </div>

          <div className="mb-8 flex items-center gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 2 ? "bg-primary" : "bg-border-subtle"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 3 ? "bg-primary" : "bg-border-subtle"
              }`}
            />
          </div>

          <Card className="rounded-3xl border border-hairline bg-white shadow-[0_20px_60px_-15px_var(--card-shadow-hover)]">
            <CardContent className="p-6">
              {step === 1 && (
                <form
                  onSubmit={handleRequestOtp}
                  className="space-y-3"
                  noValidate
                >
                  <Label htmlFor="email-mobile" className="sr-only">
                    Email address
                  </Label>
                  <PillInput
                    id="email-mobile"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    autoComplete="email"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover"
                  >
                    {loading ? "Sending OTP..." : "Send 6-digit OTP"}
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                  noValidate
                >
                  <p className="text-center text-[0.82rem] text-ink-muted">
                    Code sent to{" "}
                    <span className="font-medium text-ink">{email}</span>
                  </p>
                  <Label className="sr-only">6-digit OTP code</Label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={(v) => {
                      if (v.length === 6)
                        setTimeout(() => handleVerifyOtp(undefined, v), 120);
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[0.72rem] font-medium text-accent-ink hover:underline"
                    >
                      Change email / Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form
                  onSubmit={handleResetPassword}
                  className="space-y-3"
                  noValidate
                >
                  <div>
                    <Label htmlFor="newPassword-mobile" className="sr-only">
                      New password
                    </Label>
                    <PillInput
                      id="newPassword-mobile"
                      icon={Lock}
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      rightSlot={newPasswordToggle}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword-mobile" className="sr-only">
                      Confirm new password
                    </Label>
                    <PillInput
                      id="confirmPassword-mobile"
                      icon={Lock}
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      rightSlot={confirmPasswordToggle}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover"
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </Button>
                </form>
              )}

              <div className="mt-6 border-t border-hairline pt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-[0.82rem] font-medium text-ink-muted transition-colors hover:text-primary"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden w-full lg:grid lg:grid-cols-12 lg:gap-20">
          <aside className="lg:col-span-5">
            <div className="mb-10 flex items-center gap-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-ink-muted">
                Account recovery
              </span>
            </div>

            <h1 className="max-w-md text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
              Reset your
              <br />
              password.
            </h1>
            <p className="mt-4 max-w-sm text-[0.95rem] font-light leading-[1.6] text-ink-muted">
              Three quick steps and you&apos;re back in.
            </p>

            <ol className="mt-14 flex flex-col gap-9">
              {steps.map((s, i) => {
                const stepNum = i + 1;
                const state =
                  step === stepNum
                    ? "active"
                    : step > stepNum
                      ? "done"
                      : "upcoming";

                return (
                  <li
                    key={s.n}
                    className="grid grid-cols-[auto_1fr] items-center gap-5"
                    aria-current={state === "active" ? "step" : undefined}
                  >
                    <StepNumber value={s.n} state={state} />

                    <div>
                      <span
                        className={`block text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-colors ${
                          state === "active"
                            ? "text-accent-ink"
                            : "text-ink-muted opacity-70"
                        }`}
                      >
                        {state === "done" ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="h-3 w-3" /> Done
                          </span>
                        ) : state === "active" ? (
                          "In progress"
                        ) : (
                          "Up next"
                        )}
                      </span>

                      <h2
                        className={`mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] transition-colors ${
                          state === "active"
                            ? "text-ink"
                            : "text-ink-muted opacity-70"
                        }`}
                      >
                        {s.label}
                      </h2>

                      {state === "active" && (
                        <p className="mt-1 max-w-xs text-[0.85rem] font-light leading-[1.5] text-ink-muted">
                          {s.desc}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="flex items-center lg:col-span-7">
            <Card className="w-full max-w-md rounded-3xl border border-hairline bg-white shadow-[0_20px_60px_-15px_var(--card-shadow-hover)]">
              <CardContent className="p-8">
                {step === 1 && (
                  <form
                    onSubmit={handleRequestOtp}
                    className="space-y-4"
                    noValidate
                  >
                    <p className="text-[0.9rem] font-light leading-[1.6] text-ink-muted">
                      Enter your registered email and we&apos;ll send a 6-digit
                      code.
                    </p>
                    <Label htmlFor="email-desktop" className="sr-only">
                      Email address
                    </Label>
                    <PillInput
                      id="email-desktop"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      autoComplete="email"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover"
                    >
                      {loading ? "Sending OTP..." : "Send 6-digit OTP"}
                    </Button>
                  </form>
                )}

                {step === 2 && (
                  <form
                    onSubmit={handleVerifyOtp}
                    className="space-y-5"
                    noValidate
                  >
                    <p className="text-[0.9rem] font-light leading-[1.6] text-ink-muted">
                      We sent a code to{" "}
                      <span className="font-medium text-ink">
                        {email}
                      </span>
                    </p>
                    <Label className="sr-only">6-digit OTP code</Label>
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      onComplete={(v) => {
                        if (v.length === 6)
                          setTimeout(() => handleVerifyOtp(undefined, v), 120);
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover disabled:opacity-60"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[0.72rem] font-medium text-accent-ink hover:underline"
                      >
                        Didn&apos;t receive code? Change email / Resend OTP
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                    noValidate
                  >
                    <p className="text-[0.9rem] font-light leading-[1.6] text-ink-muted">
                      Choose a new password. At least 6 characters.
                    </p>
                    <div>
                      <Label htmlFor="newPassword-desktop" className="sr-only">
                        New password
                      </Label>
                      <PillInput
                        id="newPassword-desktop"
                        icon={Lock}
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        rightSlot={newPasswordToggle}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="confirmPassword-desktop"
                        className="sr-only"
                      >
                        Confirm new password
                      </Label>
                      <PillInput
                        id="confirmPassword-desktop"
                        icon={Lock}
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        rightSlot={confirmPasswordToggle}
                        autoComplete="new-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover"
                    >
                      {loading ? "Resetting..." : "Reset password"}
                    </Button>
                  </form>
                )}

                <div className="mt-6 border-t border-hairline pt-4 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-[0.82rem] font-medium text-ink-muted transition-colors hover:text-primary"
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}