<template>
  <!-- Anime-style speed lines + energy ring, pure SVG + CSS, no AI image -->
  <div class="anime-fx-root" aria-hidden="true">
    <!-- Speed lines radiating from center -->
    <svg class="speed-lines" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g class="lines-group">
        <line v-for="i in 16" :key="i"
          :x1="100" :y1="100"
          :x2="100 + Math.cos((i / 16) * 2 * Math.PI) * 98"
          :y2="100 + Math.sin((i / 16) * 2 * Math.PI) * 98"
          :stroke="i % 2 === 0 ? color : color2"
          stroke-width="1"
          stroke-linecap="round"
          :opacity="0.25 + (i % 3) * 0.12"
        />
      </g>
    </svg>

    <!-- Pulsing energy ring -->
    <svg class="energy-ring" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="42" fill="none" :stroke="color" stroke-width="2" stroke-dasharray="12 8" opacity="0.5"/>
      <circle cx="50" cy="50" r="32" fill="none" :stroke="color2" stroke-width="1.5" stroke-dasharray="6 10" opacity="0.35"/>
    </svg>

    <!-- Floating exclamation mark – anime reaction -->
    <div class="reaction-bubble" :style="{ color }">
      <svg viewBox="0 0 36 52" width="36" height="52" xmlns="http://www.w3.org/2000/svg">
        <!-- Shadow -->
        <rect x="15" y="5" width="8" height="32" rx="4" fill="#11141D" opacity="0.18"/>
        <circle cx="19" cy="49" r="4" fill="#11141D" opacity="0.18"/>
        <!-- Body -->
        <rect x="13" y="3" width="8" height="32" rx="4" :fill="color" stroke="#11141D" stroke-width="2"/>
        <rect x="14.5" y="5" width="3" height="20" rx="1.5" fill="white" opacity="0.35"/>
        <circle cx="17" cy="47" r="4" :fill="color" stroke="#11141D" stroke-width="2"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string
    color2?: string
  }>(),
  {
    color: '#FFD23F',
    color2: '#2F5BFF',
  },
)
</script>

<style scoped>
.anime-fx-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

/* Speed lines – bottom-right corner */
.speed-lines {
  position: absolute;
  bottom: -10%;
  right: -5%;
  width: 180px;
  height: 180px;
  opacity: 0.5;
}
.lines-group {
  animation: speed-spin 8s linear infinite;
  transform-origin: 100px 100px;
}

/* Energy ring – top-left corner */
.energy-ring {
  position: absolute;
  top: -12%;
  left: -8%;
  width: 110px;
  height: 110px;
}
.energy-ring circle:first-child {
  animation: ring-dash 3s linear infinite;
}
.energy-ring circle:last-child {
  animation: ring-dash 2s linear infinite reverse;
}

/* Reaction bubble – floating ! mark */
.reaction-bubble {
  position: absolute;
  top: 8%;
  right: 4%;
  animation: bubble-pop 2.4s ease-in-out infinite;
  filter: drop-shadow(2px 2px 0 #11141D);
}

@keyframes speed-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes ring-dash {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: 100; }
}

@keyframes bubble-pop {
  0%, 100% { transform: translateY(0)   scale(1);    opacity: 1; }
  20%       { transform: translateY(-6px) scale(1.08); opacity: 1; }
  40%       { transform: translateY(2px)  scale(0.95); opacity: 0.85; }
  60%       { transform: translateY(-3px) scale(1.04); opacity: 1; }
  80%       { transform: translateY(0)   scale(1);    opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .lines-group,
  .energy-ring circle,
  .reaction-bubble { animation: none !important; }
}
</style>
