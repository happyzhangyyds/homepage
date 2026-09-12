<template>
  <section v-if="siteLinks.length" class="links">
    <h1>网站链接</h1>
    <div class="link-grid">
      <a
        v-for="item in siteLinks"
        :key="item.link"
        class="item"
        :href="item.link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ item.name }}
      </a>
    </div>
  </section>
</template>

<script setup>
import siteLinks from "@/assets/siteLinks.json";
</script>

<style lang="scss" scoped>
.links {
  margin-top: 1.35rem;
  padding: 0 0.35rem;

  h1 {
    margin: 0 0 0.65rem 0.15rem;
    color: var(--muted-text);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-shadow: 0 1px 8px rgb(0 0 0 / 38%);
    text-transform: uppercase;
  }
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.55rem;
}

.item {
  padding: 0.78rem 1rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--surface-background);
  box-shadow: inset 0 1px 0 var(--card-highlight);
  color: var(--text-color);
  text-align: center;
  text-shadow: 0 1px 8px rgb(0 0 0 / 35%);
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--surface-border);
    background: var(--surface-hover);
    transform: translateY(-2px);
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
}

@media (max-width: 520px) {
  .links {
    padding: 0;
  }

  .link-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
