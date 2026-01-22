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
import cmsClient from "@/contentstack/contentstackClient";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import { setDataForChromeExtension } from "@/contentstack/utils";
import { addEditableTags } from "@contentstack/utils";

const Login = () => {
  const { login, signupUser, setUser, setAuthToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [authPageData, setAuthPageData] = useState(null);

  

  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/auth_page/entries/bltcb7c69182a4d93ca"
          )
        ).data.entry;

        setAuthPageData(entry);
        document.title = entry.app_title;
      } catch (error) {
        console.error("CDA: Error fetching Auth Page data:", error?.message);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("auth_page")
          .Entry("bltcb7c69182a4d93ca")
          .toJSON()
          .fetch();
        addEditableTags(entry, "auth_page",true, 'en-us')
        setAuthPageData(entry);
        document.title = entry.app_title;

        // for live preview 
        const data = {
          "entryUid":"bltcb7c69182a4d93ca",
          "contenttype":"auth_page",
          "locale":"en-us"
        }
        setDataForChromeExtension(data)
      } catch (error) {
        console.error("SDK: Error fetching Auth Page data:", error?.message);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      fetchSDKData()
      onEntryChange(fetchSDKData);
    } else {
      fetchCDAData();
    }
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
            : "Something went wrong";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 px-4">
      <Card className="w-full max-w-md rounded-3xl border border-purple-100/60 shadow-[0_20px_60px_-15px_rgba(88,28,135,0.25)] backdrop-blur-sm bg-white/90">
        <Toaster />

        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-purple-700" {...authPageData?.$?.app_title}>
              {authPageData?.app_title}
            </h2>
            <p className="text-sm text-gray-500" {...authPageData?.$?.subtitle}>
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
            <span className="text-xs uppercase tracking-wide text-gray-400">
              OR
            </span>
            <Separator className="flex-1" />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 rounded-xl bg-purple-50 p-1 mb-6">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {authPageData.login_text}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
                  <Label className="text-sm text-gray-600">
                    {authPageData.email_label}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder={authPageData.email_placeholder}
                    className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">
                    {authPageData.password_label}
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    placeholder={authPageData.password_placeholder}
                    className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 shadow-md transition"
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
                  <Label className="text-sm text-gray-600">
                    {authPageData.name_label}
                  </Label>
                  <Input
                    name="name"
                    placeholder={authPageData.name_placeholder}
                    className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">
                    {authPageData.email_label}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder={authPageData.email_placeholder}
                    className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">
                    {authPageData.phone_number_label}
                  </Label>
                  <Input
                    name="phone"
                    type="number"
                    placeholder={authPageData.phone_number_placeholder}
                    className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">
                    {authPageData.password_label}
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    placeholder={authPageData.password_placeholder}
                    className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 shadow-md transition"
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
