"use client";

import React, { useState, useCallback } from "react";
import { track } from "@vercel/analytics";
import { useUser } from "@/lib/auth-stub.client";
import { useHydrated } from "@/hooks/useHydrated";
import { useTheme } from "../contexts/ThemeContext";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const { colorValue } = useTheme();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--background)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-in fade-in slide-in-from-top-4 vh-card-elevated w-full max-w-md rounded-xl border p-6 duration-200"
        style={{ borderColor: `${colorValue}66`, backgroundColor: 'var(--background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-google-sans-code text-lg font-bold text-[var(--foreground)]">Message Received</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Close modal"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="font-google-sans-code text-sm text-[var(--text-muted)]">
          {children}
        </div>
      </div>
      
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
};

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="my-2 border-l-4 border-red-900 bg-red-50 p-4 font-google-sans-code text-sm"
    >
      {message}
    </div>
  );
};

type PolicyDoc = "privacy" | "terms";

// Short, in-form summaries of /privacy and /terms so visitors can review and
// agree without leaving the message they're writing ("leaving the cart").
// The full pages stay one (secondary) click away.
const POLICY_SUMMARIES: Record<PolicyDoc, { title: string; href: string; points: string[] }> = {
  privacy: {
    title: "Privacy, the short version",
    href: "/privacy",
    points: [
      "Your first name, email, and message are used only to read and reply to you.",
      "Messages are delivered to our private Slack workspace — never sold or shared for marketing.",
      "Analytics only run if you accept the cookie banner; this form works either way.",
      "You can ask us to access, correct, or delete your data anytime at info@unparty.app.",
    ],
  },
  terms: {
    title: "Terms, the short version",
    href: "/terms",
    points: [
      "unparty.app is provided as-is by UNPARTY LLC — use it lawfully and respectfully.",
      "What you write here stays yours; the service, design, and content remain ours.",
      "Nothing on the site is professional (legal, financial, medical) advice.",
      "Questions about the terms? Reach us at info@unparty.app.",
    ],
  },
};

interface PolicyPanelProps {
  doc: PolicyDoc;
  onAgree: () => void;
  onClose: () => void;
}

const PolicyPanel: React.FC<PolicyPanelProps> = ({ doc, onAgree, onClose }) => {
  const { colorValue } = useTheme();
  const { title, href, points } = POLICY_SUMMARIES[doc];

  return (
    <div
      id="policy-panel"
      role="region"
      aria-label={title}
      className="animate-in fade-in slide-in-from-top-2 rounded-lg border-2 bg-[var(--background-highlight)] p-4 duration-200"
      style={{ borderColor: `${colorValue}66` }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-google-sans-code text-sm font-bold text-[var(--foreground)]">{title}</h4>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
          aria-label="Close summary"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <ul className="mb-3 flex list-disc flex-col gap-1 pl-4">
        {points.map((point) => (
          <li key={point} className="font-google-sans-code text-xs leading-relaxed text-[var(--text-muted)]">
            {point}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAgree}
          className="rounded-lg bg-[var(--foreground)] px-3 py-1.5 font-google-sans-code text-xs text-[var(--background)] transition-opacity hover:opacity-90"
        >
          Agree &amp; continue
        </button>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-google-sans-code text-xs text-[var(--text-muted)] underline transition-opacity hover:no-underline hover:opacity-80"
        >
          Read the full version ↗
        </a>
      </div>
    </div>
  );
};

interface ChatProps {
  onClose?: () => void;
  // Where this message came from (e.g. a route), forwarded to Slack as
  // extra context - not shown in the form itself.
  context?: string;
}

const makeChallenge = () => ({
  a: Math.floor(Math.random() * 9) + 1,
  b: Math.floor(Math.random() * 9) + 1,
});

const Chat = ({ onClose, context }: ChatProps = {}) => {
  const { colorValue } = useTheme();
  const { isSignedIn, user } = useUser();
  const [message, setMessage] = useState("");
  // null = untouched, so a signed-in sender's account details prefill the
  // field without ever overwriting what they've typed (or cleared)
  const [typedEmail, setEmail] = useState<string | null>(null);
  const [typedFirstName, setFirstName] = useState<string | null>(null);
  const email = typedEmail ?? (isSignedIn ? user?.primaryEmailAddress?.emailAddress : undefined) ?? "";
  const firstName = typedFirstName ?? (isSignedIn ? user?.firstName : undefined) ?? "";
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({ email: "", message: "", firstName: "", terms: "", verification: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Privacy/terms open inline (below) instead of navigating away, so
  // visitors never lose the message they're composing.
  const [openPolicy, setOpenPolicy] = useState<PolicyDoc | null>(null);
  // Human verification: tiny math challenge, only shown once hydrated (keeps
  // SSR/hydration deterministic), verified again server-side.
  const hydrated = useHydrated();
  const [challenge, setChallenge] = useState(makeChallenge);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  // Honeypot — invisible to humans; bots that fill it are dropped server-side.
  const [honeypot, setHoneypot] = useState("");


  const showPolicy = useCallback((doc: PolicyDoc) => {
    setOpenPolicy(doc);
    track("connect_policy_viewed", { doc, context: context ?? "direct" });
  }, [context]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = useCallback(() => {
    const newErrors = { email: "", message: "", firstName: "", terms: "", verification: "" };
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = "Please enter your first name";
      isValid = false;
    }

    if (!message.trim()) {
      newErrors.message = "Please enter a message";
      isValid = false;
    }

    if (!email) {
      newErrors.email = "Please enter your email";
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!agreedToTerms) {
      newErrors.terms = "Please agree to the Privacy Policy and Terms";
      isValid = false;
    }

    if (!isSignedIn && challenge) {
      const parsed = Number(challengeAnswer.trim());
      if (!challengeAnswer.trim()) {
        newErrors.verification = "Please answer the verification question";
        isValid = false;
      } else if (!Number.isInteger(parsed) || parsed !== challenge.a + challenge.b) {
        newErrors.verification = "That answer doesn't look right — try again";
        setChallenge(makeChallenge());
        setChallengeAnswer("");
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [email, message, firstName, agreedToTerms, challenge, challengeAnswer, isSignedIn]);

  const sanitizeInput = (input: string) =>
    input
      .replace(/[<>]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

  const handleSendMessage = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const sanitizedMessage = sanitizeInput(message);
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFirstName = sanitizeInput(firstName);

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sanitizedMessage,
          email: sanitizedEmail,
          firstName: sanitizedFirstName,
          context,
          website: honeypot,
          challenge: !isSignedIn && challenge
            ? { a: challenge.a, b: challenge.b, answer: Number(challengeAnswer.trim()) }
            : undefined,
        }),
      });

      if (response.status === 429) {
        setSubmitError("You're sending messages too quickly. Please wait a minute and try again.");
        return;
      }

      if (!response.ok) throw new Error("Failed to send message");

      await response.json();
      track("connect_message_sent", { context: context ?? "direct" });
      setMessage("");
      setEmail("");
      setFirstName("");
      setAgreedToTerms(false);
      setOpenPolicy(null);
      setChallenge(makeChallenge());
      setChallengeAnswer("");
      if (onClose) {
        onClose();
      } else {
        setShowModal(true);
      }
    } catch (error) {
      console.error(error);
      setSubmitError("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6" role="main">
      {!onClose && <h2 className="font-google-sans-code text-xl font-bold uppercase">CONNECT</h2>}

      {submitError && <ErrorMessage message={submitError} />}

      <div className="flex flex-col gap-4 border-l-2 pl-4" style={{ borderColor: `${colorValue}66` }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex flex-col gap-4"
        >
          <div className="relative">
            <textarea
              aria-label="Message"
              className="min-h-[100px] w-full resize-none rounded-lg border-2 border-transparent bg-[var(--background-highlight)] p-4 font-google-sans-code text-sm transition-colors focus:border-[var(--foreground)] focus:outline-none"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <span id="message-error" className="mt-1 block font-google-sans-code text-sm text-red-900">
                {errors.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative grow">
              <input
                type="text"
                aria-label="First name"
                className="w-full rounded-lg border-2 border-transparent bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm transition-colors focus:border-[var(--foreground)] focus:outline-none"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={errors.firstName ? "true" : "false"}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <span id="firstName-error" className="mt-1 block font-google-sans-code text-sm text-red-900">
                  {errors.firstName}
                </span>
              )}
            </div>

            <div className="relative grow">
              <input
                type="email"
                aria-label="Email address"
                className="w-full rounded-lg border-2 border-transparent bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm transition-colors focus:border-[var(--foreground)] focus:outline-none"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span id="email-error" className="mt-1 block font-google-sans-code text-sm text-red-900">
                  {errors.email}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[80px] rounded-lg bg-[var(--foreground)] px-4 py-2 font-google-sans-code text-sm text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </div>

          {/* Honeypot — visually hidden; humans never see or fill it */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor="website-field">Website</label>
            <input
              id="website-field"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Human verification — skipped for signed-in senders */}
          {/* Signed-in senders skip the challenge — their Clerk session
              already establishes they're not a bot. */}
          {hydrated && !isSignedIn && (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="human-verification"
                  className="font-google-sans-code text-sm text-[var(--foreground)]"
                >
                  Quick human check: what is {challenge.a} + {challenge.b}?
                </label>
                <input
                  id="human-verification"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-20 rounded-lg border-2 border-transparent bg-[var(--background-highlight)] px-3 py-1.5 font-google-sans-code text-sm transition-colors focus:border-[var(--foreground)] focus:outline-none"
                  placeholder="?"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  aria-invalid={errors.verification ? "true" : "false"}
                  aria-describedby={errors.verification ? "verification-error" : undefined}
                />
              </div>
              {errors.verification && (
                <span id="verification-error" className="block font-google-sans-code text-sm text-red-900">
                  {errors.verification}
                </span>
              )}
            </div>
          )}

          {/* Terms and Privacy Checkbox */}
          <div className="mt-4 flex items-start gap-3">
            <div className="relative mt-1 shrink-0">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="size-4 rounded border-2 bg-[var(--background-highlight)] accent-[var(--foreground)] focus:ring-2 focus:ring-[var(--foreground)]"
                style={{ borderColor: `${colorValue}66` }}
                aria-invalid={errors.terms ? "true" : "false"}
                aria-describedby={errors.terms ? "terms-error" : undefined}
              />
            </div>
            <div className="flex-1">
              <p className="font-google-sans-code text-sm text-[var(--foreground)]">
                <label htmlFor="terms-checkbox" className="cursor-pointer">
                  I agree to the
                </label>{" "}
                <button
                  type="button"
                  onClick={() => showPolicy("privacy")}
                  aria-expanded={openPolicy === "privacy"}
                  aria-controls="policy-panel"
                  className="text-[var(--foreground)] underline transition-opacity hover:no-underline hover:opacity-80"
                >
                  Privacy Policy
                </button>{" "}
                <label htmlFor="terms-checkbox" className="cursor-pointer">
                  and
                </label>{" "}
                <button
                  type="button"
                  onClick={() => showPolicy("terms")}
                  aria-expanded={openPolicy === "terms"}
                  aria-controls="policy-panel"
                  className="text-[var(--foreground)] underline transition-opacity hover:no-underline hover:opacity-80"
                >
                  Terms
                </button>
              </p>
              {errors.terms && (
                <span id="terms-error" className="mt-1 block font-google-sans-code text-sm text-red-900 dark:text-red-400">
                  {errors.terms}
                </span>
              )}
            </div>
          </div>

          {/* In-form policy summary — review and agree without leaving the message */}
          {openPolicy && (
            <PolicyPanel
              doc={openPolicy}
              onAgree={() => {
                setAgreedToTerms(true);
                setOpenPolicy(null);
                setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              onClose={() => setOpenPolicy(null)}
            />
          )}
        </form>
      </div>

      {!onClose && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <p>Thanks. I will get back to you!</p>
        </Modal>
      )}
    </div>
  );
};

export default Chat;
