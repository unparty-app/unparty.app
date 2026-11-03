"use client";

import { usePathname } from 'next/navigation';
import CoverPhoto from './CoverPhoto';

const ConditionalHeroSection = () => {
  const pathname = usePathname();

  // Don't render hero section on auth pages
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  if (isAuthPage) {
    return null;
  }


  return (
    <>
      {/* Banner section */}
      

      {/* #page-top now lives on the persistent <main> in the root layout
          (src/app/layout.tsx) — it's a stable nav target on every route,
          not dependent on where this component happens to land per page. */}
      <div className="w-full" style={{ paddingTop: '2rem' }}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-8 lg:px-12">
<CoverPhoto className="mb-6" />
        </div>

        <section className="w-full">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-8 lg:px-12">


          {/*}  <PageAsterisk /> */}
          </div>
        </section>
      </div>
    </>
  );
};

export default ConditionalHeroSection;