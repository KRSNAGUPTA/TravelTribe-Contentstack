import React, { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { toast } from "@/hooks/use-toast";
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
import Loading from "./Loading";
import cmsClient from "@/contentstack/contentstackClient";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import { setDataForChromeExtension } from "@/contentstack/utils";
import { addEditableTags } from "@contentstack/utils";

function Contact() {
  const [contactData, setContactData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    url: window.location.origin
  });

  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/contact_page/entries/blt66e7166f9eac8711"
          )
        ).data.entry;

        setContactData(entry);
        if (entry?.page_title) document.title = entry.page_title;
      } catch (error) {
        console.error("CDA: Error fetching Contact Page data:", error?.message);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("contact_page")
          .Entry("blt66e7166f9eac8711")
          .toJSON()
          .fetch();
        addEditableTags(entry, "contact_page",true, 'en-us')
        setContactData(entry);
        if (entry?.page_title) document.title = entry.page_title;

        // for live preview 
        const data = {
          "entryUid":"blt66e7166f9eac8711",
          "contenttype":"contact_page",
          "locale":"en-us"
        }
        setDataForChromeExtension(data)
      } catch (error) {
        console.error("SDK: Error fetching Contact Page data:", error?.message);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      fetchSDKData()
      onEntryChange(fetchSDKData);
    } else {
      fetchCDAData();
    }
  }, []);

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
      await api.post("/api/support", formData);
      toast({
        title: "Message sent",
        description: "We will get back to you soon",
      });
      setFormData({ name: "", email: "", topic: "", message: "" });
    } catch {
      toast({
        title: "Error sending message",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (!contactData) return <Loading />;

  const { contact } = contactData;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--bg-muted)]">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <main className="flex flex-col items-center px-6 md:px-10 lg:px-20 py-16 pb-36 space-y-10">
        <div className="text-center max-w-xl">
          <h1 className="text-4xl font-bold text-[var(--text-dark)]" {...contactData?.$?.title}>
            {contactData?.title}
          </h1>
          <p className="text-[var(--text-muted)] mt-3" {...contactData?.$?.subtext}>
            {contactData?.subtext}{" "}
            <a
              href={`mailto:${contactData?.email}`}
              className="text-[var(--primary)] font-medium"
              {...contactData?.$?.email}
            >
              {contactData?.email}
            </a>
          </p>
        </div>

        <form
          onSubmit={sendMessage}
          className="w-full max-w-lg bg-white shadow-md rounded-xl p-8 space-y-6 border border-[var(--border)]"
        >
          <div>
            <Label className="text-[var(--text-dark)]">
              {contact.name_label}
            </Label>
            <Input
              name="name"
              placeholder={contact.name_placeholder}
              value={formData.name}
              onChange={handleChange}
              className="mt-2 border-[var(--border)] focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <Label className="text-[var(--text-dark)]">
              {contact.email_label}
            </Label>
            <Input
              name="email"
              type="email"
              placeholder={contact.email_placeholder}
              value={formData.email}
              onChange={handleChange}
              className="mt-2 border-[var(--border)] focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <Label className="text-[var(--text-dark)]">
              {contact.topic_label}
            </Label>
            <Select
              value={formData.topic}
              onValueChange={(value) =>
                setFormData({ ...formData, topic: value })
              }
            >
              <SelectTrigger className="mt-2 border-[var(--border)]">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
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
            <Label className="text-[var(--text-dark)]">
              {contact.message_label}
            </Label>
            <Textarea
              name="message"
              rows={5}
              placeholder={contact.message_placeholder}
              value={formData.message}
              onChange={handleChange}
              className="mt-2 border-[var(--border)] focus:ring-[var(--primary)]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
          >
            {contact.send_button}
          </Button>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
