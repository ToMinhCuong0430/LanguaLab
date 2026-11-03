<template>
  <!-- Anime-style sparkle group – pure SVG + CSS, no images -->
  <div class="anime-sparkle-root" aria-hidden="true">
    <!-- Star 1 – large spin + scale pulse -->
    <svg class="sparkle sparkle--lg sparkle--a" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 L17.5 13 L28 16 L17.5 19 L16 30 L14.5 19 L4 16 L14.5 13 Z" :fill="color" stroke="currentColor" stroke-width="1"/>
      <path d="M16 8 L16.6 13.5 L21 16 L16.6 18.5 L16 24 L15.4 18.5 L11 16 L15.4 13.5 Z" fill="white" opacity="0.6"/>
    </svg>
    <!-- Star 2 – small fast twinkle -->
    <svg class="sparkle sparkle--sm sparkle--b" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1 L13 9.5 L21 12 L13 14.5 L12 23 L11 14.5 L3 12 L11 9.5 Z" :fill="color2" stroke="currentColor" stroke-width="0.5"/>
    </svg>
    <!-- Star 3 – medium delayed -->
    <svg class="sparkle sparkle--md sparkle--c" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 1 L15.2 11 L25 14 L15.2 17 L14 27 L12.8 17 L3 14 L12.8 11 Z" :fill="color3" stroke="currentColor" stroke-width="0.8"/>
      <path d="M14 6 L14.5 11.5 L19 14 L14.5 16.5 L14 22 L13.5 16.5 L9 14 L13.5 11.5 Z" fill="white" opacity="0.5"/>
    </svg>
    <!-- Plus-cross sparkle – anime hair clip style -->
    <svg class="sparkle sparkle--xs sparkle--d" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="2" x2="10" y2="18" :stroke="color" stroke-width="2" stroke-linecap="round"/>
      <line x1="2" y1="10" x2="18" y2="10" :stroke="color" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.3" y1="4.3" x2="15.7" y2="15.7" :stroke="color2" stroke-width="1" stroke-linecap="round"/>
      <line x1="15.7" y1="4.3" x2="4.3" y2="15.7" :stroke="color2" stroke-width="1" stroke-linecap="round"/>
    </svg>
    <!-- Floating circle orbs -->
    <svg class="sparkle sparkle--orb sparkle--e" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" :fill="color3" opacity="0.7"/>
      <circle cx="6" cy="6" r="2" fill="white" opacity="0.6"/>
    </svg>
    <svg class="sparkle sparkle--orb sparkle--f" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="4.5" :fill="color" opacity="0.55"/>
      <circle cx="5" cy="5" r="1.5" fill="white" opacity="0.5"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string
    color2?: string
    color3?: string
  }>(),
  {
    color: '#FFD23F',
    color2: '#FF70A6',
    color3: '#23D5E8',
  },
)
</script>

<style scoped>
.anime-sparkle-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

.sparkle {
  position: absolute;
}

/* Sizes */
.sparkle--xs { width: 16px; height: 16px; }
.sparkle--sm { width: 20px; height: 20px; }
.sparkle--md { width: 28px; height: 28px; }
.sparkle--lg { width: 36px; height: 36px; }
.sparkle--orb { width: 14px; height: 14px; }

/* Positions */
.sparkle--a { top: 6%;  left: 8%;  }
.sparkle--b { top: 14%; right: 10%; }
.sparkle--c { bottom: 18%; left: 5%;  }
.sparkle--d { top: 38%; right: 6%;  }
.sparkle--e { bottom: 10%; right: 15%; }
.sparkle--f { top: 55%;  left: 3%;  }

/* Animations */
.sparkle--a {
  animation: anime-spin-pulse 2.8s ease-in-out infinite;
}
.sparkle--b {
  animation: anime-twinkle 1.6s ease-in-out infinite;
  animation-delay: 0.3s;
}
.sparkle--c {
  animation: anime-spin-pulse 3.4s ease-in-out infinite;
  animation-delay: 0.9s;
}
.sparkle--d {
  animation: anime-twinkle 2s ease-in-out infinite;
  animation-delay: 1.2s;
}
.sparkle--e {
  animation: anime-orb-float 3s ease-in-out infinite;
  animation-delay: 0.5s;
}
.sparkle--f {
  animation: anime-orb-float 2.5s ease-in-out infinite;
  animation-delay: 1.4s;
}

@keyframes anime-spin-pulse {
  0%   { transform: rotate(0deg) scale(1);    opacity: 0.9; }
  25%  { transform: rotate(45deg) scale(1.25); opacity: 1; }
  50%  { transform: rotate(90deg) scale(0.85); opacity: 0.6; }
  75%  { transform: rotate(135deg) scale(1.15); opacity: 1; }
  100% { transform: rotate(180deg) scale(1);   opacity: 0.9; }
}

@keyframes anime-twinkle {
  0%, 100% { transform: scale(1) rotate(0deg);   opacity: 1; }
  30%       { transform: scale(0.3) rotate(25deg); opacity: 0.2; }
  60%       { transform: scale(1.3) rotate(-10deg); opacity: 1; }
}

@keyframes anime-orb-float {
  0%, 100% { transform: translateY(0) scale(1);    opacity: 0.7; }
  50%       { transform: translateY(-8px) scale(1.2); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .sparkle { animation: none !important; }
}
</style>
