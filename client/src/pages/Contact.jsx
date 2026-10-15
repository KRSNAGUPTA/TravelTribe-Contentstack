import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Loader, Mail } from "lucide-react";

function PillInput({
  id,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      {Icon && (
        <Icon
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
            focused ? "text-primary" : "text-ink-muted"
          }`}
        />
      )}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`h-11 rounded-full ${Icon ? "pl-11" : "pl-4"} pr-4`}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required
      />
    </div>
  );
}

function Contact() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    url: window.location.origin,
  });
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.topic ||
      !formData.message
    ) {
      toast({
        title: "All fields are required",
        description: "Please fill out all the fields before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/support", formData);
      toast({
        title: "Query received",
        description: "Our team will contact you soon!",
      });
      setFormData({
        name: "",
        email: "",
        topic: "",
        message: "",
        url: window.location.origin,
      });
    } catch (err) {
      toast({
        title: "Error sending message",
        description:
          err?.response?.data?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink">
      <Toaster />

      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <Header />
      </div>

      {/* Ambient dotted background */}
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

      {/* Corner warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(600px circle at 0% 0%, hsl(var(--primary) / 0.06), transparent 60%), radial-gradient(600px circle at 100% 100%, hsl(var(--accent) / 0.08), transparent 60%)",
        }}
      />

      <main className="relative mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-12 sm:px-8 sm:pt-16 lg:max-w-5xl lg:px-12 lg:pt-20">
        

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-20">
          {/* LEFT — copy */}
          <aside className="flex flex-col items-left justify-center lg:col-span-5">
            <h1 className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[2.5rem]">
              Say hello.
            </h1>
            <p className="mt-4 max-w-sm text-[0.95rem] font-light leading-[1.6] text-ink-muted">
              Questions, feedback, partnerships — drop us a line and we&apos;ll
              get back to you.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </span>
              <a
                href="mailto:up.krishnagupta@gmail.com"
                className="text-[0.9rem] font-medium text-ink transition-colors hover:text-primary"
              >
                up.krishnagupta@gmail.com
              </a>
            </div>
          </aside>

          {/* RIGHT — form card */}
          <div className="lg:col-span-7">
            <div className="w-full lg:mx-auto lg:max-w-md">
              <div className="rounded-3xl border border-hairline bg-white p-6 shadow-[0_20px_60px_-15px_var(--card-shadow-hover)] sm:p-7">
                <form onSubmit={sendMessage} className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="sr-only">
                      Name
                    </Label>
                    <PillInput
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="sr-only">
                      Email
                    </Label>
                    <PillInput
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="topic" className="sr-only">
                      Topic
                    </Label>
                    <Select
                      value={formData.topic}
                      onValueChange={(value) =>
                        setFormData({ ...formData, topic: value })
                      }
                    >
                      <SelectTrigger
                        id="topic"
                        className="h-11 rounded-full border-input px-5 text-left data-[placeholder]:text-ink-muted focus:ring-primary/30"
                      >
                        <SelectValue placeholder="What's this about?" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectItem value="help">
                          I need help with my booking
                        </SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="partnership">
                          Business / Partnership
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="sr-only">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us what's on your mind..."
                      className="resize-none rounded-3xl border-input p-4 leading-[1.55] focus-visible:ring-primary/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send message"
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-center text-[0.72rem] text-ink-muted">
                  Usually replies within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;