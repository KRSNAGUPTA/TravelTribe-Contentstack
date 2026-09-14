import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import api, { setAccessToken } from "@/api";
import { trackEvent } from "@/Lytics/config";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntries, setDataForChromeExtension } from "@/contentstack/utils";
import { StickyBar } from "@/components/StickyBanner";

const Login = () => {
  const { login, signupUser, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [authPageData, setAuthPageData] = useState(null);
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  let pageData = {
    entryUid: "bltcb7c69182a4d93ca",
    contenttype: "auth_page",
    locale: import.meta.env.VITE_CS_LOCALE,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = (await fetchEntries("auth_page", import.meta.env.VITE_SDK, null))[0];
        pageData.entryUid = entry?.uid;
        setAuthPageData(entry);
        if (entry?.app_title) document.title = entry.app_title;
      } catch (error) {
        console.error("Error fetching auth page data", error);
      }
    };

    onEntryChange(fetchData);
    setDataForChromeExtension(pageData);
  }, []);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const phonePattern = /^\d{10}$/ //10 digit number

    try {
      if (type === "signup") {
        if (data.phone.length != 10 || !phonePattern.test(data.phone) ) {
          setLoading(false);
          return toast({ title: "Invalid phone number", variant: "destructive" });
        }
        if (data.password.length < 8) {
          setLoading(false);
          return toast({ title: "Password must be at least 8 characters", variant: "destructive" });
        }

        await signupUser(data);
        toast({
          title: authPageData.sign_up_text,
          description: `Welcome ${data.name}`,
          icon: <CheckCircle className="text-green-500" />,
        });
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
      console.error(err)
      const message =
        err.response?.status === 409
          ? "User already exists"
          : err.response?.status === 400
            ? "Invalid credentials"
            : "Login: Something went wrong";

      setError(message);
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
  const googleLoginEnabled = import.meta.env.VITE_GOOGLE_CLIENT_ID !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--hero-grad-start)] via-white to-[var(--hero-grad-end)] px-4">
      <StickyBar/>
      <Card className="w-full max-w-md rounded-3xl shadow-[0_20px_60px_-15px_var(--card-shadow-hover)] backdrop-blur-sm bg-white/90">
        <Toaster />

        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <h2 className="pacifico-regular text-3xl font-semibold tracking-tight text-[var(--primary)] md:text-4xl">
              {authPageData?.app_title}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {authPageData?.subtitle}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            {googleLoginEnabled ? (
              <GoogleLogin
                useOneTap={true}
                onSuccess={async (credentialResponse) => {
                  try {
                    const res = await api.post("/api/user/google/callback", {
                      token: credentialResponse.credential,
                    });

                    const returnedUser = res.data.user;
                    const accessToken = res.data.accessToken;

                    setAccessToken(accessToken);
                    setUser(returnedUser);
                    localStorage.setItem("user", JSON.stringify(returnedUser));

                    toast({ title: "Login Successful" });
                    trackEvent("google_login", {
                      email: returnedUser.email,
                      name: returnedUser.name,
                    });
                    navigate("/");
                  } catch (googleErr) {
                    toast({
                      title: "Google login failed",
                      variant: "destructive",
                    });
                  }
                }}
                onError={() => {
                  toast({
                    title: "Google login failed",
                    variant: "destructive",
                  });
                }}
              />
            ) : (
              <Button disabled className="w-full rounded-xl">
                Google Login Disabled
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              OR
            </span>
            <Separator className="flex-1" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid grid-cols-2 rounded-xl bg-[var(--primary-soft)] p-1">
              <TabsTrigger value="login" className="rounded-lg">
                {authPageData.login_text}
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">
                {authPageData.sign_up_text}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={(e) => handleAuth(e, "login")} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">
                    {authPageData.email_label}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={handleDataChange}
                    placeholder={authPageData.email_placeholder}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-[var(--text-dark)]">
                      {authPageData.password_label}
                    </Label>
                    <Link
                      to={`/forgot-password${data?.email? `?email=${data.email}`:""}`}
                      className="text-xs font-medium text-purple-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    name="password"
                    type="password"
                    value={data.password}
                    onChange={handleDataChange}
                    placeholder={authPageData.password_placeholder}
                    className="rounded-xl"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] shadow-md transition hover:bg-[var(--primary-hover)]"
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

              <form onSubmit={(e) => handleAuth(e, "signup")} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">{authPageData.name_label}</Label>
                  <Input
                    name="name"
                    value={data.name}
                    onChange={handleDataChange}
                    placeholder={authPageData.name_placeholder}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">{authPageData.email_label}</Label>
                  <Input
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={handleDataChange}
                    placeholder={authPageData.email_placeholder}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">{authPageData.phone_number_label}</Label>
                  <Input
                    name="phone"
                    type="number"
                    value={data.phone}
                    onChange={handleDataChange}
                    placeholder={authPageData.phone_number_placeholder}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-[var(--text-dark)]">{authPageData.password_label}</Label>
                  <Input
                    name="password"
                    type="password"
                    value={data.password}
                    onChange={handleDataChange}
                    placeholder={authPageData.password_placeholder}
                    className="rounded-xl"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] shadow-md transition hover:bg-[var(--primary-hover)]"
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