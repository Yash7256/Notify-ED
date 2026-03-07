import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Home() {
  return (
    <div className="relative h-screen w-full overflow-hidden text-white grain">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1920&q=80')"
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 h-full">
        {/* Headline + CTA */}
        <div className="absolute left-6 md:left-16 bottom-28 space-y-6 max-w-5xl">
          <h1 className="font-fraunces text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight whitespace-pre-line md:whitespace-pre text-white">
            {`We notify, students know
 that's the system.`}
          </h1>

          <Button
            className="h-auto rounded-[2px] bg-[#c8f542] px-6 py-3 text-black text-lg font-semibold uppercase tracking-[0.1em] hover:brightness-110"
          >
            Start Notifying
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Right-side description */}
        <p className="absolute bottom-20 right-6 md:right-16 max-w-xs md:max-w-sm text-right text-[#c8f542] font-fraunces italic text-lg md:text-xl hidden sm:block">
         Upload your student list, pick a semester, fill marks row by row  the moment you press Enter, every student is notified on Email and WhatsApp. Zero manual work.
        </p>
      </div>
    </div>
  )
}
