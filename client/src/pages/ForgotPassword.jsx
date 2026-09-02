import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/api";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, KeyRound, Mail, Lock, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/user/forgot-password", { email });
      toast({ title: "OTP Sent!", description: res.data.message || "Check your email for the 6-digit OTP." });
      setStep(2);
    } catch (err) {
      toast({
        title: "Failed to send OTP",
        description: err.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit OTP", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/user/verify-otp", { email, otp });
      toast({ title: "Verified!", description: res.data.message || "OTP verified successfully." });
      setStep(3);
    } catch (err) {
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/user/reset-password", {
        email,
        otp,
        newPassword,
      });
      toast({ title: "Success!", description: res.data.message || "Password reset successful." });
      navigate("/login");
    } catch (err) {
      toast({
        title: "Reset Failed",
        description: err.response?.data?.message || "Could not reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-16">
        <Card className="w-full max-w-md shadow-lg border border-purple-100 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-br from-purple-50 to-indigo-50/50 pb-6 border-b border-gray-100">
            <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 bubblegum-sans-regular">
              Reset Password
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {step === 1 && "Enter your registered email to receive a 6-digit OTP"}
              {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
              {step === 3 && "Enter your new password below"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-purple-600" : "bg-gray-200"}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-purple-600" : "bg-gray-200"}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-purple-600" : "bg-gray-200"}`} />
            </div>

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-600" /> Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-2.5 transition-all shadow-md"
                >
                  {loading ? "Sending OTP..." : "Send 6-Digit OTP"}
                </Button>
              </form>
            )}

            {/* STEP 2: Enter OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" /> 6-Digit OTP Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-500 text-center text-xl font-bold letter-spacing-2 tracking-widest"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-2.5 transition-all shadow-md"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-purple-600 hover:underline font-medium"
                  >
                    Didn't receive code? Change Email / Resend OTP
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Reset Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-600" /> New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-600" /> Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-2.5 transition-all shadow-md"
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center border-t pt-4">
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
