<template>
  <div class="relative inline-flex" @mouseenter="show = true" @mouseleave="show = false">
    <!-- Trigger -->
    <slot />

    <!-- Tooltip -->
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        :class="tooltipClasses"
        class="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none font-label"
      >
        {{ text }}
        <!-- Arrow -->
        <div :class="arrowClasses" class="absolute w-2 h-2 bg-gray-900 transform rotate-45"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  text: string
  position?: 'top' | 'right' | 'bottom' | 'left'
}

const props = withDefaults(defineProps<Props>(), {
  position: 'right',
})

const show = ref(false)

const tooltipClasses = computed(() => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }
  return positions[props.position]
})

const arrowClasses = computed(() => {
  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
  }
  return arrows[props.position]
})
</script>
