'use client';

import React, { useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

import { ChevronDown, ChevronUp, Mail } from "@/app/components/icons";

interface EmailRecord {
  id: string;
  email: string;
  to: string;
  purpose: string;
  content: string;
  attachments: File[];
  sentDate: string;
  respond: string;
  respondDate: string;
  followUpDate: string;
  emailSent: boolean;
  emailError: boolean;
}

const EmailTracker = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [email, setEmail] = useState("");
  const [to, setTo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [respond, setRespond] = useState("");
  const [customResponse, setCustomResponse] = useState("");
  const [respondDate, setRespondDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showCustomPurpose, setShowCustomPurpose] = useState(false);
  const [showCustomResponse, setShowCustomResponse] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // Today in the reader's timezone, which the server can't know, so it waits for the browser
  const hydrated = useHydrated();
  const creationDate = hydrated ? new Date().toLocaleDateString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }) : '';

  const [purposeOptions, setPurposeOptions] = useState([
    { value: "ABOUT.", label: "learn about unparty" },
    { value: "BUILD.", label: "build with unparty" },
    { value: "CONNECT.", label: "connect with unparty" },
    { value: "follow-up", label: "Follow-up" },
    { value: "introduction", label: "Introduction" },
    { value: "custom", label: "read by human, be respectful" }
  ]);

  const [responseOptions, setResponseOptions] = useState([
    { value: "pending", label: "Pending" },
    { value: "received", label: "Received" },
    { value: "no-response", label: "No Response" },
    { value: "custom", label: "Add Custom Status..." }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleCustomPurpose = () => {
    if (customPurpose.trim()) {
      const newOption = {
        value: customPurpose.toLowerCase().replace(/\s+/g, '-'),
        label: customPurpose.trim()
      };
      setPurposeOptions(prev => [...prev.filter(o => o.value !== 'custom'), newOption, { value: 'custom', label: 'Add Custom Purpose...' }]);
      setPurpose(newOption.value);
      setCustomPurpose("");
      setShowCustomPurpose(false);
    }
  };

  const handleCustomResponse = () => {
    if (customResponse.trim()) {
      const newOption = {
        value: customResponse.toLowerCase().replace(/\s+/g, '-'),
        label: customResponse.trim()
      };
      setResponseOptions(prev => [...prev.filter(o => o.value !== 'custom'), newOption, { value: 'custom', label: 'Add Custom Status...' }]);
      setRespond(newOption.value);
      setCustomResponse("");
      setShowCustomResponse(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmail: EmailRecord = {
      id: crypto.randomUUID(),
      email,
      to,
      purpose,
      content,
      attachments,
      sentDate: new Date().toISOString().split('T')[0],
      respond,
      respondDate,
      followUpDate,
      emailSent: true,
      emailError: false,
    };
    setEmails([newEmail, ...emails]);
    resetForm();
  };

  const resetForm = () => {
    setEmail("");
    setTo("");
    setPurpose("");
    setContent("");
    setAttachments([]);
    setRespond("");
    setRespondDate("");
    setFollowUpDate("");
    setShowCustomPurpose(false);
    setShowCustomResponse(false);
  };

  const deleteEmail = (id: string) => {
    setEmails(emails.filter(email => email.id !== id));
  };

  const isFollowUpDue = (record: EmailRecord) => {
    if (!record.followUpDate) return false;
    const today = new Date();
    const followUp = new Date(record.followUpDate);
    return today >= followUp;
  };

  // Calculate days until follow-up
  const getDaysUntilFollowUp = (date: string) => {
    const today = new Date();
    const followUp = new Date(date);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="w-full">
    {/* Header Row - Always Visible */}
    <div 
      className={`flex cursor-pointer items-center rounded-lg border  p-3 shadow-sm
        ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-vt323 text-gray-600">{creationDate}</span>
          <span className="text-gray-300">|</span>
          <span className="font-google-sans-code font-medium transition-colors hover:text-blue-600">
            📮
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Mail className="size-5 text-blue-600" />
          {isExpanded ? (
            <ChevronUp className="size-5 text-gray-400" />
          ) : (
            <ChevronDown className="size-5 text-gray-400" />
          )}
        </div>
      </div>
    </div>

    {/* Expandable Content */}
    {isExpanded && (
    <div className="mx-auto flex max-w-4xl flex-col p-6">
      <form onSubmit={handleSubmit} className="app-form-container mb-8">
        <h3 className="mb-6 text-xl font-bold" style={{ color: '#F9C22E' }}>Send Email</h3>
        <div className="app-form-grid app-form-grid-2">
          <div className="app-field-group">
            <label className="app-label app-label-required">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="app-input"
              placeholder="info@unparty.app"
              required
            />
          </div>
          <div className="app-field-group">
            <label className="app-label app-label-required">Recipient</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="app-input"
              placeholder="recipient@unparty.app"
              required
            />
          </div>
          
          <div className="app-field-group">
            <label className="app-label app-label-required">CORE.</label>
            <div className="space-y-2">
              <select
                value={purpose}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomPurpose(true);
                    setPurpose('');
                  } else {
                    setPurpose(e.target.value);
                  }
                }}
                className="app-input app-select"
                required
              >
                <option value="">Select purpose</option>
                {purposeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {showCustomPurpose && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    placeholder="Enter custom purpose"
                    className="flex-1 rounded border p-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCustomPurpose}
                    className="app-button-secondary"
                  >
                    add
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="app-field-group">
            <label className="app-label">Response Status</label>
            <div className="space-y-2">
              <select
                value={respond}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomResponse(true);
                    setRespond('');
                  } else {
                    setRespond(e.target.value);
                  }
                }}
                className="app-input app-select"
              >
                <option value="">Select status</option>
                {responseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {showCustomResponse && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customResponse}
                    onChange={(e) => setCustomResponse(e.target.value)}
                    placeholder="Enter custom status"
                    className="app-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleCustomResponse}
                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                  >
                    add
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Response Date</label>
            <input
              type="date"
              value={respondDate}
              onChange={(e) => setRespondDate(e.target.value)}
              className="rounded border p-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="app-field-group">
            <label className="app-label">Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="app-input"
            />
          </div>
        </div>

        <div className="app-form-grid">
          <div className="app-field-group">
            <div className="mb-1 flex items-center justify-between">
              <label className="app-label">Email Content</label>
              <button
                type="button"
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="app-button-secondary text-sm"
              >
                {isContentExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`app-input app-textarea resize-none transition-all duration-200 ${
                isContentExpanded ? 'h-96' : 'h-32'
              }`}
              placeholder="Paste your email content here..."
            />
          </div>

          <div className="app-field-group">
            <label className="app-label">Attachments</label>
            <div className="space-y-2">
              <div className="app-file-input">
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="app-file-input-label"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Choose Files
                </label>
              </div>
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between rounded border bg-white p-2">
                    <span className="truncate text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="app-form-actions app-form-actions-center">
          <button
            type="submit"
            className="app-button-primary"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Track Email
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {emails.map((emailRecord) => (
          <div
            key={emailRecord.id}
            className={`rounded-lg border bg-white p-4 shadow ${
              isFollowUpDue(emailRecord) ? 'border-yellow-400' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">To:</span>
                  <span>{emailRecord.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Purpose:</span>
                  <span>{purposeOptions.find(opt => opt.value === emailRecord.purpose)?.label || emailRecord.purpose}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Sent:</span>
                  <span>{emailRecord.sentDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className={`rounded-full px-2 py-1 text-sm ${
                    emailRecord.respond === 'received' 
                      ? 'bg-green-100 text-green-800'
                      : emailRecord.respond === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {responseOptions.find(opt => opt.value === emailRecord.respond)?.label || emailRecord.respond}
                  </span>
                </div>
                {emailRecord.respondDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Response Date:</span>
                    <span>{emailRecord.respondDate}</span>
                  </div>
                )}
                {emailRecord.followUpDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Follow-up:</span>
                    <span className={`${
                      isFollowUpDue(emailRecord) ? 'font-medium text-yellow-600' : ''
                    }`}>
                      {isFollowUpDue(emailRecord) 
                        ? 'Follow-up needed!' 
                        : `In ${getDaysUntilFollowUp(emailRecord.followUpDate)} days`}
                    </span>
                  </div>
                )}
                {emailRecord.attachments.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Attachments:</span>
                    <div className="mt-1 space-y-1">
                      {emailRecord.attachments.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {emailRecord.content && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const element = document.getElementById(`content-${emailRecord.id}`);
                        if (element) {
                          element.style.display = element.style.display === 'none' ? 'block' : 'none';
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Toggle Content
                    </button>
                    <div
                      id={`content-${emailRecord.id}`}
                      className="mt-2 rounded bg-gray-50 p-3"
                      style={{ display: 'none' }}
                    >
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {emailRecord.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => deleteEmail(emailRecord.id)}
                className="ml-4 text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTracker;