'use client';

import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../../contexts/ThemeContext';

// Keep in sync with QUOTE_MAX_LENGTH in src/app/api/book/schema.ts
const QUOTE_MAX_LENGTH = 300;

interface Book {
  id: string;
  sku: string;
  title: string;
  author: string;
  quote?: string;
  page?: number;
  publisher?: string;
  publisherLink?: string;
  inStock: boolean;
  claimedBy?: string | null;
  claimedAt?: string | null;
  condition?: string;
  paymentStatus: string;
}

interface BookFormState {
  title: string;
  author: string;
  quote?: string;
  page?: number;
  publisher?: string;
  publisherLink?: string;
  condition?: string;
}

const emptyForm: BookFormState = {
  title: '', author: '', quote: '', page: undefined, publisher: '', publisherLink: '', condition: '',
};

export default function BooksAdminContent() {
  const { colorValue } = useTheme();
  const { data: books = [], loading, error: loadError, refetch } = useFetch<Book[]>('/api/book');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<BookFormState>(emptyForm);

  const error = saveError ?? loadError;

  const startAdd = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setShowAddForm(true);
  };

  const startEdit = (book: Book) => {
    setShowAddForm(false);
    setEditingId(book.id);
    setFormState({
      title: book.title,
      author: book.author,
      quote: book.quote || '',
      page: book.page,
      publisher: book.publisher || '',
      publisherLink: book.publisherLink || '',
      condition: book.condition || '',
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormState(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(editingId ? `/api/book/${editingId}` : '/api/book', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save book');
      }
      cancelForm();
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BookFormState, value: string | number | undefined) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const inputClass = 'w-full rounded-lg border px-3 py-2 font-google-sans-code text-sm';
  const inputStyle = { borderColor: `${colorValue}20`, backgroundColor: 'var(--background)', color: 'var(--foreground)' };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500/15 text-green-500';
      case 'PENDING': return 'bg-yellow-500/15 text-yellow-500';
      default: return 'bg-red-500/15 text-red-500';
    }
  };

  const quoteLength = formState.quote?.length || 0;
  const quoteOverLimit = quoteLength > QUOTE_MAX_LENGTH;
  const quoteMissingAttribution = !!formState.quote && (!formState.page || !formState.publisher);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded" style={{ backgroundColor: `${colorValue}15` }}></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded" style={{ backgroundColor: `${colorValue}10` }}></div>
          ))}
        </div>
      </div>
    );
  }

  const formOpen = showAddForm || !!editingId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          BOOKS.
        </h1>
        <button
          onClick={formOpen ? cancelForm : startAdd}
          className="rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: colorValue }}
        >
          {formOpen ? 'Cancel' : 'Add Book'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border p-4 font-google-sans-code text-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {formOpen && (
        <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
          <h2 className="mb-4 font-google-sans-code text-lg font-bold uppercase" style={{ color: 'var(--foreground)' }}>
            {editingId ? 'Edit Book' : 'Add New Book'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Title *</label>
                <input type="text" required value={formState.title} onChange={(e) => handleInputChange('title', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Author *</label>
                <input type="text" required value={formState.author} onChange={(e) => handleInputChange('author', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Quote</label>
                <span
                  className="font-google-sans-code text-xs"
                  style={{ color: quoteOverLimit ? '#f87171' : 'var(--text-muted)' }}
                >
                  {quoteLength}/{QUOTE_MAX_LENGTH}
                </span>
              </div>
              <textarea value={formState.quote} onChange={(e) => handleInputChange('quote', e.target.value)} rows={3} className={inputClass} style={inputStyle} />
              <p className="mt-1 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                Keep it brief (a sentence or two) with a page citation — this is attribution, not reproduction.
              </p>
              {quoteMissingAttribution && (
                <p className="mt-1 font-google-sans-code text-xs" style={{ color: '#f87171' }}>
                  A quote needs both a page number and publisher to save.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Page</label>
                <input type="number" value={formState.page || ''} onChange={(e) => handleInputChange('page', e.target.value ? parseInt(e.target.value) : undefined)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Condition</label>
                <select value={formState.condition} onChange={(e) => handleInputChange('condition', e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="">Select condition</option>
                  {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Publisher</label>
                <input type="text" value={formState.publisher} onChange={(e) => handleInputChange('publisher', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Publisher Link</label>
                <input type="url" value={formState.publisherLink} onChange={(e) => handleInputChange('publisherLink', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || quoteOverLimit || quoteMissingAttribution}
              className="w-full rounded-lg px-4 py-3 font-google-sans-code text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: colorValue }}
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Book'}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
        <div className="border-b px-6 py-4" style={{ borderColor: `${colorValue}20` }}>
          <h2 className="font-google-sans-code text-sm font-bold uppercase" style={{ color: 'var(--foreground)' }}>
            Inventory <span className="font-vt323 text-base ml-2" style={{ color: colorValue }}>{books.length}</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colorValue}20` }}>
                {['SKU', 'Book', 'Quote', 'Payment', 'Claimed By', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book, i) => (
                <tr
                  key={book.id}
                  style={{ borderBottom: i < books.length - 1 ? `1px solid ${colorValue}10` : undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-highlight)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="whitespace-nowrap p-4 font-vt323 text-sm" style={{ color: colorValue }}>{book.sku}</td>
                  <td className="p-4">
                    <div className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>{book.title}</div>
                    <div className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>by {book.author}</div>
                    {book.condition && (
                      <div className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>{book.condition}</div>
                    )}
                  </td>
                  <td className="max-w-xs p-4">
                    {book.quote ? (
                      <span className="font-google-sans-code text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        &ldquo;{book.quote.slice(0, 60)}{book.quote.length > 60 ? '…' : ''}&rdquo;
                      </span>
                    ) : (
                      <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <span className={`inline-flex rounded-full px-2 py-1 font-google-sans-code text-xs font-semibold ${getPaymentBadge(book.paymentStatus)}`}>
                      {book.paymentStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-4 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
                    {book.claimedBy || '—'}
                    {book.claimedAt && (
                      <div className="font-vt323 text-xs">{new Date(book.claimedAt).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <button
                      onClick={() => startEdit(book)}
                      className="font-google-sans-code text-xs font-semibold hover:underline"
                      style={{ color: colorValue }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {books.length === 0 && (
          <div className="p-8 text-center font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
            No books in inventory. Add your first book to get started.
          </div>
        )}
      </div>
    </div>
  );
}
