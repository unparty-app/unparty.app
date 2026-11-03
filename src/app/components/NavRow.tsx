import Image from 'next/image';
import Link from 'next/link';

const NavRow = () => {
  return (
    <div className="row-start-3 flex flex-wrap items-center justify-center gap-6">
      <Link
        href="/about"
        className="flex items-center gap-2 text-black transition-all duration-300 hover:underline hover:underline-offset-4 dark:text-white"
      >
        <Image
          aria-hidden
          src="/svgs/unparty/about.svg"
          alt="File icon"
          width={16}
          height={16}
          className="dark:invert w-auto h-auto"
        />

      </Link>

      <Link
        href="/connect"
        className="flex items-center gap-2 text-black transition-all duration-300 hover:underline hover:underline-offset-4 dark:text-white"
      >
        <Image
          aria-hidden
          src="/svgs/unparty/about.svg"
          alt="File icon"
          width={16}
          height={16}
          className="dark:invert w-auto h-auto"
        />
        
      </Link>
      
      <Link
        href="/connect"
        className="flex items-center gap-2 text-black transition-all duration-300 hover:underline hover:underline-offset-4 dark:text-white"
      >
        <Image
          aria-hidden
          src="/svgs/unparty/connect.svg"
          alt="Globe icon"
          width={16}
          height={16}
          className="dark:invert w-auto h-auto"
        />
      
      </Link>
    </div>
  );
};

export default NavRow;