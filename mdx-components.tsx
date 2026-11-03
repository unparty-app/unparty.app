import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headers with custom styling
    h1: ({ children }) => (
      <h1 className="text-4xl md:text-5xl font-bold mb-6 font-google-sans-code text-yellow-400 uppercase">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mb-4 mt-8 text-white border-b border-gray-700 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-medium mb-3 mt-6 text-gray-300">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl mb-2 mt-4 text-gray-400 italic font-light">
        {children}
      </h4>
    ),
    
    // Paragraphs
    p: ({ children }) => (
      <p className="mb-4 text-gray-200 leading-7">
        {children}
      </p>
    ),
    
    // Lists
    ul: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc text-gray-200">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal text-gray-200">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-1">
        {children}
      </li>
    ),
    
    // Links
    a: ({ href, children }) => (
      <Link 
        href={href as string} 
        className="text-blue-400 hover:text-blue-300 underline transition-colors"
      >
        {children}
      </Link>
    ),
    
    // Code
    code: ({ children }) => (
      <code className="bg-gray-800 px-2 py-1 rounded text-sm font-vt323 text-green-400">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700">
        {children}
      </pre>
    ),
    
    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-yellow-400 pl-4 my-4 italic text-gray-300">
        {children}
      </blockquote>
    ),
    
    // Images
    img: ({ src, alt }) => (
      <Image
        src={src as string}
        alt={alt as string}
        width={800}
        height={400}
        className="rounded-lg my-6 border border-gray-700"
      />
    ),
    
    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-bold text-white">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-300">
        {children}
      </em>
    ),
    
    // Horizontal rule
    hr: () => (
      <hr className="my-8 border-gray-600" />
    ),
    
    ...components,
  };
}