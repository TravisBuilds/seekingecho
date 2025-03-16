'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function IntroPage() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen relative overflow-hidden intro-content">
      {/* Background Image - lowest layer */}
      <div className="absolute inset-0" style={{ zIndex: -1 }}>
        <Image
          src="/images/background.png"
          alt="Background"
          fill
          priority
          style={{ objectFit: 'cover', zIndex: -1 }}
          quality={100}
        />
      </div>

      {/* Whale Image - middle layer */}
      <div style={{ 
        position: 'absolute',
        left: '-20px',
        top: '50%',
        transform: 'translateY(-30%)',
        width: '370px',
        height: '370px',
        zIndex: 1,
        marginLeft: '-20px',
        paddingLeft: '0'
      }}>
        <Image
          src="/images/whale.png"
          alt="Whale"
          fill
          priority
          style={{ 
            objectFit: 'contain',
            left: '-20px',
            marginLeft: '0',
            paddingLeft: '0'
          }}
        />
      </div>

      {/* Dark overlay - middle layer */}
      {/* <div className="absolute inset-0 bg-black/50 z-[5]" /> */}

      {/* Content Container - top layer */}
      <div className="relative h-full" style={{ zIndex: 2 }}>
        {/* Title section at top */}
        <div style={{ 
          paddingTop: '8rem',
          paddingLeft: '2rem',
          color: 'white'
        }}>
          <p className="text-5xl font-bold">
            Welcome to
          </p>
          <h1 className="text-10xl font-bold mt-2">
            Seeking Echos
          </h1>
        </div>

        {/* Button container at bottom */}
        <div style={{ 
          position: 'absolute',
          bottom: '4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}>
          <button
            onClick={() => router.push('/map')}
            style={{
              backgroundColor: 'black',
              color: 'white',
              fontSize: '1.5rem',
              padding: '1rem 4rem',
              borderRadius: '9999px',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'black';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
} 