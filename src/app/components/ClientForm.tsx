"use client";

import { useEffect, useMemo, useState } from 'react';

export default function ClientForm() {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        businessName: string;
        image: File | null;
        goals: string;
    }>({
        name: '',
        businessName: '',
        image: null,
        goals: ''
    });

    // One object URL per selected file (creating it during render leaked a
    // new blob URL on every render); revoked when the file changes or on unmount
    const imagePreviewUrl = useMemo(
        () => (formData.image ? URL.createObjectURL(formData.image) : null),
        [formData.image]
    );
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
        // Notify you (e.g., send email, log to console, etc.)
        console.log("Form submitted:", formData);
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <h1 className="mb-4 text-3xl font-bold">Welcome, {formData.name}!</h1>
                <p>Business Name: {formData.businessName}</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview; next/image can't load object URLs */}
                {imagePreviewUrl && <img src={imagePreviewUrl} alt="Business Image" />}
                <p>Goals: {formData.goals}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="app-form-container w-full max-w-md">
                <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: '#F9C22E' }}>
                    Client Information
                </h2>
                <form onSubmit={handleSubmit} className="app-form-grid">
                    <div className="app-field-group">
                        <label className="app-label app-label-required">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="app-input"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>
                    
                    <div className="app-field-group">
                        <label className="app-label app-label-required">
                            Business Name
                        </label>
                        <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            className="app-input"
                            placeholder="Enter your business name"
                            required
                        />
                    </div>
                    
                    <div className="app-field-group">
                        <label className="app-label">
                            Business Image
                        </label>
                        <div className="app-file-input">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="app-file-input-label">
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {formData.image ? formData.image.name : 'Choose an image'}
                            </label>
                        </div>
                    </div>
                    
                    <div className="app-field-group">
                        <label className="app-label app-label-required">
                            Goals
                        </label>
                        <textarea
                            value={formData.goals}
                            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                            className="app-input app-textarea"
                            placeholder="Describe your business goals and objectives"
                            required
                        />
                    </div>
                    
                    <div className="app-form-actions app-form-actions-center">
                        <button type="submit" className="app-button-primary">
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Submit Information
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

