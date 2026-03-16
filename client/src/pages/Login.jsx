import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { GoogleLogin } from "@react-oauth/google";
import { Separator } from "@/components/ui/separator";
import api from "@/api";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import {
  fetchEntryById,
  setDataForChromeExtension,
} from "@/contentstack/utils";

const Login = () => {
  const { login, signupUser, setUser, setAuthToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [authPageData, setAuthPageData] = useState(null);

  const data = {
    entryUid: "bltcb7c69182a4d93ca",
    contenttype: "auth_page",
    locale: import.meta.env.VITE_CS_LOCALE,
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = await fetchEntryById(
          data.contenttype,
          data.entryUid,
          import.meta.env.VITE_SDK,
          null,
        );
        setAuthPageData(entry);
        if (entry?.app_title) document.title = entry.app_title;
      } catch (error) {
        console.error("Error fetching auth page data", error);
      }
    };

    onEntryChange(fetchData);
    setDataForChromeExtension(data);
  }, []);

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (type === "signup") {
        if (data.phone.length < 10) {
          return toast({
            title: "Invalid phone number",
            variant: "destructive",
          });
        }

        if (data.password.length < 8) {
          return toast({
            title: "Password must be at least 8 characters",
            variant: "destructive",
          });
        }

        await signupUser(data);

        toast({
          title: authPageData.sign_up_text,
          description: `Welcome ${data.name}`,
          icon: <CheckCircle className="text-green-500" />,
        });

        e.target.reset();
        setActiveTab("login");
        return;
      }

      await login(data.email, data.password);

      toast({
        title: authPageData.login_text,
        description: "You are now logged in",
        icon: <CheckCircle className="text-green-500" />,
      });

      navigate("/");
    } catch (err) {
      const message =
        err.status === 409
          ? "User already exists"
          : err.status === 400
            ? "Invalid credentials"
            : "Login: Something went wrong";

      setError(message);
      console.log("Authentication error details:", err);

      toast({
        title: "Authentication Failed",
        description: message,
        variant: "destructive",
        icon: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authPageData) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--hero-grad-start)] via-white to-[var(--hero-grad-end)] px-4">
      <Card className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] shadow-[0_20px_60px_-15px_var(--card-shadow-hover)] backdrop-blur-sm bg-white/90">
        <Toaster />

        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <h2
              className="pacifico-regular text-3xl font-semibold tracking-tight text-[var(--primary)] md:text-4xl"
              {...authPageData?.$?.app_title}
            >
              {authPageData?.app_title}
            </h2>
            <p className="text-sm text-[var(--text-muted)]" {...authPageData?.$?.subtitle}>
              {authPageData?.subtitle}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const data = await api.post("/api/user/google/callback", {
                  token: credentialResponse.credential,
                });

                localStorage.setItem("token", data.data.jwtToken);
                localStorage.setItem("user", JSON.stringify(data.data.user));
                setUser(data.data.user);
                setAuthToken(data.data.jwtToken);

                toast({ title: "Login Successful" });

                // identifyUser(data.data.user.email);
                jstag.send({
                  _e: "google_login",
                  email: data.data.user.email,
                  name: data.data.user.name,
                });

                // console.log("Google login successful, user data:", data.data);
                navigate("/");
              }}
              onError={() =>
                toast({
                  title: "Google login failed",
                  variant: "destructive",
                })
              }
            />
          </div>

          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              OR
            </span>
            <Separator className="flex-1" />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 grid grid-cols-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--primary-soft)] p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg text-[var(--text-muted)] data-[state=active]:bg-white data-[state=active]:text-[var(--text-dark)] data-[state=active]:shadow-sm"
              >
                {authPageData.login_text}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg text-[var(--text-muted)] data-[state=active]:bg-white data-[state=active]:text-[var(--text-dark)] data-[state=active]:shadow-sm"
              >
                {authPageData.sign_up_text}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={(e) => handleAuth(e, "login")}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.email_label}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder={authPageData.email_placeholder}
                    className="rounded-xl border-[var(--border)] bg-white text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.password_label}
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    placeholder={authPageData.password_placeholder}
                    className="rounded-xl border-[var(--border)] bg-white text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] shadow-md transition hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
                >
                  {loading ? "Signing in..." : authPageData.login_text}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={(e) => handleAuth(e, "signup")}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.name_label}
                  </Label>
                  <Input
                    name="name"
                    placeholder={authPageData.name_placeholder}
                    className="rounded-xl border-[var(--border)] bg-white text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.email_label}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder={authPageData.email_placeholder}
                    className="rounded-xl border-[var(--border)] bg-white text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.phone_number_label}
                  </Label>
                  <Input
                    name="phone"
                    type="number"
                    placeholder={authPageData.phone_number_placeholder}
                    className="rounded-xl border-[var(--border)] bg-white text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.password_label}
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    placeholder={authPageData.password_placeholder}
                    className="rounded-xl border-[var(--border)] bg-white text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] shadow-md transition hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
                >
                  {loading ? "Creating account..." : authPageData.sign_up_text}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
