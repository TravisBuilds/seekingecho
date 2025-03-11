'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function IntroPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image - lowest layer */}
      <div className="fixed inset-0" style={{ zIndex: 0, position: 'relative' }}>
        <Image
          src="/images/orca-splash.png"
          alt="Orca splash"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={100}
        />
      </div>

      {/* Content Container - top layer */}
      <div className="relative min-h-screen flex flex-col items-center justify-between p-8" style={{ zIndex: 10 }}>
        {/* Title Section */}
        <div className="pt-12 text-center">
          <h1 className="text-white text-4xl font-bold mb-2">
            Welcome to
          </h1>
          <h2 className="text-white text-6xl font-bold">
            Seeking Echo
          </h2>
        </div>

        {/* Button Section */}
        <div className="pb-16">
          <Link href="/map">
            <button
              className="bg-black/80 text-white px-12 py-3 rounded-full text-xl 
                       font-semibold hover:scale-105 transition-transform"
            >
              Start
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
} 