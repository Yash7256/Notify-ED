"use client";

import { ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";

const teamAvatars = [
  {
    initials: "JD",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  },
  {
    initials: "HJ",
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
  },
  {
    initials: "PI",
    src: "https://images.unsplash.com/photo-1524504388940-9f8be1dd252a",
  },
  {
    initials: "KD",
    src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
  },
  {
    initials: "LD",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
  },
];

const stats = [
  { emoji: "🚀", label: "IN CLIENT REVENUE GENERATED", value: "$5M+" },
  { emoji: "📈", label: "BUSINESSES LAUNCHED", value: "200+" },
  { emoji: "💰", label: "SAVED IN OPERATIONAL COSTS", value: "$500K+" },
];

function AvatarStack() {
  return (
    <div className="flex -space-x-3">
      {teamAvatars.map((member, i) => (
        <Avatar
          className="h-12 w-12 border-2 border-primary bg-neutral-800"
          key={member.initials}
          style={{ zIndex: teamAvatars.length - i }}
        >
          <AvatarImage alt={`Team member ${i + 1}`} src={member.src} />
          <AvatarFallback className="bg-neutral-700 text-white text-xs">
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function StatsMarquee() {
  return (
    <Marquee
      className="border-white/10 border-y bg-black/30 py-2 backdrop-blur-sm [--duration:30s] [--gap:2rem]"
      pauseOnHover
      repeat={4}
    >
      {stats.map((stat) => (
        <div
          className="flex items-center gap-3 whitespace-nowrap"
          key={stat.label}
        >
          <span className="font-bold font-mono text-[oklch(0.95_0.16_118.89)] text-sm tracking-wide">
            {stat.value}
          </span>
          <span className="font-medium font-mono text-sm text-white/70 uppercase tracking-[0.15em]">
            {stat.label}
          </span>
          <span className="text-base">{stat.emoji}</span>
        </div>
      ))}
    </Marquee>
  );
}

export default function Hero() {
  return (
    <section className="relative flex h-screen w-full flex-col items-start justify-end">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1545239351-1141bd82e8a6)",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 text-white sm:px-8 lg:px-16">
        <div className="space-y-4">
          <AvatarStack />
          <StatsMarquee />
        </div>
      </div>
      <div className="relative z-10 w-full px-4 pb-16 sm:px-8 sm:pb-24 lg:px-16 lg:pb-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-4 sm:w-1/2">
            <h1 className="font-medium text-4xl text-white leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              We <span className="text-[oklch(0.95_0.16_118.89)]">think</span>, you{" "}
              <span className="text-[oklch(0.95_0.16_118.89)]">grow</span>
              <br />
              <span className="text-white">— that's the deal</span>
            </h1>
            <Button className="rounded-none py-0 pr-0 font-normal text-black text-lg bg-[oklch(0.95_0.16_118.89)] hover:bg-[oklch(0.95_0.16_118.89)]/90">
              Get Template
              <span className="border-neutral-500 border-l p-3">
                <ArrowRight />
              </span>
            </Button>
          </div>
          <div className="w-full sm:w-1/2">
            <p className="text-base text-[oklch(0.95_0.16_118.89)] italic sm:text-right md:text-2xl">
              We take your big ideas and turn them into clear, winning
              strategies. From setting up your company to scaling it worldwide,
              we're here every step of the way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
