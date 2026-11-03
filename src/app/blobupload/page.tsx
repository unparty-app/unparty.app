"use client";

import { useState } from "react";

const BlobuploadPage = () => {
  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col gap-6">
        <UploadForm />
      </div>
    </main>
  );
};

function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setUrl(null);

    const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
      method: "POST",
      body: file,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? `Upload failed (${res.status})`);
      return;
    }
    setUrl(data.url);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="rounded bg-black p-2 text-white"
      >
        Upload
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {url && (
        <div className="mt-4">
          <p>Uploaded! View it:</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {url}
          </a>
        </div>
      )}
    </div>
  );
}

export default BlobuploadPage;
