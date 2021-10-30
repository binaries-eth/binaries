<script setup lang="ts">
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { extendWithMath } from '../lib/inputSanitation'

interface Params {
  x?: number;
  y?: number;
  p1?: number;
  p2?: number;
  p3?: number;
  p4?: number;
  p5?: number;
  p6?: number;
  p7?: number;
  p8?: number;
  p9?: number;
}

const props = defineProps<{
  formula: string
  params: number[]
  size: number
  scaled?: boolean
  fillStyle?: string
}>()

const formula = computed(() => extendWithMath(props.formula))
const params = computed(() => props.params)
const { size } = props
const canvas = ref(null)

const evaled = (f: string) => {
  return eval(`({x,y,p1,p2,p3,p4,p5,p6,p7,p8,p9}) => ${f}`)
}

const parseParams = (p: number[]): Params => Object.fromEntries(p.map((v, i) => [`p${i+1}`, v]))

const draw = (ctx: CanvasRenderingContext2D, size: number, formula: string, params: number[]) => {
  try {
    let f = evaled(formula)
    let p: Params = parseParams(params)

    ctx.clearRect(0, 0, size, size)

    let a = {...p}
    for (a.x = -size/2; a.x < size/2; a.x++) {
      for (a.y = -size/2; a.y < size/2; a.y++) {
        f(a) && ctx.fillRect(a.x + size/2, a.y + size/2, 1, 1)
      }
    }
  } catch(e) {
    // propagate formula error up
    console.log(e)
  }
}

let stopWatching: any

onMounted(() => {
  const c = canvas.value as unknown as HTMLCanvasElement
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  ctx.fillStyle = props.fillStyle || '#efefef'

  stopWatching = watchEffect(() => draw(ctx, size, formula.value, params.value))
})

onUnmounted(() => {
  stopWatching()
})
</script>

<template>
  <div class="renderer" :class="{ scaled }">
    <canvas class="canvas" ref="canvas" :width="size" :height="size"></canvas>
  </div>
</template>

<style scoped>
  .renderer {
    background-color: #111;
    border-radius: 8px;
  }
  .scaled .canvas {
    width: 256px;
    height: 256px;
  }

  .canvas {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
