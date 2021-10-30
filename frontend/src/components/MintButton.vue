<script setup lang="ts">
const props = defineProps<{
  minting: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button :disabled="disabled" class="pushable" :class="{ minting }" @click.stop.prevent="emit('click')">
    <span class="shadow"></span>
    <span class="edge"></span>
    <span class="front">
      MINT
    </span>
  </button>
</template>

<style scoped>
  .pushable {
    position: relative;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    outline-offset: 4px;
    transition: filter 250ms;
  }

  .shadow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background: hsl(52, 66%, 33%);
    /* background-color: hsl(308, 100%, 32%); */
    will-change: transform;
    transform: translateY(0px);
    transition:
      transform 600ms cubic-bezier(.3, .7, .4, 1);
    box-shadow:
      1px 1px 3px hsl(52, 66%, 33%);
  }

  .edge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background-image: linear-gradient(90deg,  hsl(285, 85%, 37%), hsl(15, 85%, 37%), hsl(285, 85%, 37%));
    background-size: 360px;
  }

  .front {
    font-family: "IBM Plex Mono", monospace;
    display: block;
    position: relative;
    width: 180px;
    line-height: 60px;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 500;
    color: white;
    background-image: linear-gradient(90deg,  #c034ef, #ef6334, #c034ef);
    background-size: 360px;
    will-change: transform;
    transform: translateY(-1px);
    transition:
      transform 600ms cubic-bezier(.3, .7, .4, 1);
  }

  .pushable:hover {
    filter: brightness(105%);
  }

  .pushable:hover .front {
    transform: translateY(-2px);
    /* opacity: 1; */
    transition:
      transform 250ms cubic-bezier(.3, .7, .4, 1.5);
  }

  .pushable:active .front {
    transform: translateY(0px);
    transition: transform 34ms;
  }

  .pushable:hover .shadow {
    transform: translateY(1px);
    transition:
      transform 250ms cubic-bezier(.3, .7, .4, 1.5);
  }

  .pushable:active .shadow {
    transform: translateY(1px);
    transition: transform 34ms;
  }

  .pushable:focus:not(:focus-visible) {
    outline: none;
  }
  .pushable[disabled] {
    cursor: not-allowed;
    filter: none;
  }
  .pushable[disabled] .front {
    background-image: none;
    background-color: hsl(204, 2%, 68%);
  }
  .pushable[disabled] .edge {
    background: linear-gradient(to right,
        hsl(52, 66%, 33%) 0%,
        hsl(52, 66%, 23%) 100%);
  }
  .pushable.minting {
    cursor: progress;
    filter: none;
  }
  .pushable[disabled]:hover .front, .pushable.minting:hover .front {
    transform: translateY(-1px);
  }
  .pushable[disabled]:hover .shadow, .pushable.minting:hover .shadow {
    transform: translateY(0px);
  }

  .pushable.minting .front {
    background-image: linear-gradient(90deg,  #c034ef, #ef6334, #c034ef);
    animation: slidebg 2s linear infinite;
  }

  @keyframes slidebg {
    to {
      background-position:360px;
    }
  }
</style>
