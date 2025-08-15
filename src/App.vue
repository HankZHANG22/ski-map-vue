<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import FiltersPanel from './components/FiltersPanel.vue'
import LeafletMap from './components/LeafletMap.vue'
import HowToUse from './components/HowToUse.vue'
import { RESORTS, type Resort } from './data/resorts'
import { FLAG, withFlag } from './utils/flags'

const resorts = ref<Resort[]>(RESORTS)
const filtered = ref<Resort[]>([])

const filters = reactive({
  country: '',
  difficulties: ['Beginner', 'Intermediate', 'Advanced'] as Array<Resort['difficulty']>,
  priceMin: 0,
  priceMax: 300,
  keyword: '',
})

function updateFilters(payload: Partial<typeof filters> & Record<string, unknown>) {
  Object.assign(filters, payload)
}

const countries = computed(() =>
  [...new Set(resorts.value.map((r) => r.country))].sort((a, b) => a.localeCompare(b)),
)

const filteredResorts = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return resorts.value.filter((r) => {
    if (kw && !(r.name.toLowerCase().includes(kw) || r.country.toLowerCase().includes(kw)))
      return false
    if (filters.country && r.country !== filters.country) return false
    if (filters.difficulties.length && !filters.difficulties.includes(r.difficulty)) return false
    if (!(r.price >= filters.priceMin && r.price <= filters.priceMax)) return false
    return true
  })
})

const mapRef = ref<InstanceType<typeof LeafletMap> | null>(null)
function focusCountry(c: string) {
  filters.country = c
  mapRef.value?.fitToCountry?.(c)
}

function resetAll() {
  updateFilters({
    country: '',
    difficulties: ['Beginner', 'Intermediate', 'Advanced'],
    priceMin: 0,
    priceMax: 300,
    keyword: '',
  })
  mapRef.value?.fitToAll?.()
}

onMounted(() => {
  document.getElementById('btnReset')?.addEventListener('click', resetAll)
})

const loading = ref(false)
const loadError = ref<string | null>(null)
onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}resorts.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as Resort[]
    const DIFF = new Set<Resort['difficulty']>(['Beginner', 'Intermediate', 'Advanced'])
    const cleaned: Resort[] = (Array.isArray(data) ? data : []).filter(
      (r) =>
        r &&
        typeof r.id === 'number' &&
        typeof r.country === 'string' &&
        typeof r.name === 'string' &&
        typeof r.lat === 'number' &&
        typeof r.lng === 'number' &&
        DIFF.has(r.difficulty) &&
        typeof r.price === 'number' &&
        typeof r.ticket_url === 'string' &&
        (!r.trails ||
          (typeof r.trails === 'object' &&
            (typeof r.trails.green === 'number' || r.trails.green === undefined) &&
            (typeof r.trails.red === 'number' || r.trails.red === undefined) &&
            (typeof r.trails.black === 'number' || r.trails.black === undefined))),
    )
    if (cleaned.length) {
      resorts.value = cleaned.map((r) => ({
        ...r,
        trails: r.trails || { green: 0, red: 0, black: 0 },
      }))
      filtered.value = resorts.value
      if (!cleaned.some((r) => r.country === filters.country)) filters.country = ''
    } else {
      loadError.value = 'resorts.json has no valid items. Using demo data.'
      console.warn('[resorts.json] No valid items, keep built-in demo.')
      filtered.value = resorts.value
    }
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e)
    loadError.value = `Failed to load resorts.json (${msg}) — using demo data`
    console.warn('[resorts.json] load failed, keep built-in demo:', e)
    filtered.value = resorts.value
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <header>
    <div class="bar">
      <div class="brand pill">⛷️ Global Ski Resorts</div>
      <button class="btn" id="btnReset">Reset World View</button>
      <span style="flex: 1"></span>
      <small style="color: var(--muted)"
        >Tip: click any marker to see tickets and live weather</small
      >
    </div>
    <div class="country-row">
      <button class="pill chip" v-for="c in countries" :key="c" @click="focusCountry(c)">
        {{ withFlag(c) }}
      </button>
    </div>
  </header>
  <main class="app">
    <aside class="side">
      <div
        v-if="loading || loadError"
        style="
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
        "
      >
        <template v-if="loading">⏳ Loading ski resort data...</template>
        <template v-else-if="loadError">⚠️ {{ loadError }}</template>
      </div>
      <filters-panel
        :countries="countries"
        :selected-country="filters.country"
        :selected-difficulties="filters.difficulties"
        :price-min="filters.priceMin"
        :price-max="filters.priceMax"
        :keyword="filters.keyword"
        @update-filters="updateFilters"
        @focus-country="focusCountry"
      />
      <how-to-use />
    </aside>
    <section class="map-pane">
      <leaflet-map ref="mapRef" :resorts="resorts" :filtered="filteredResorts" :flag-map="FLAG" />
    </section>
  </main>
  <footer class="footer">Demo data for showcase. Weather by OpenWeatherMap.</footer>
</template>

<style>
:root {
  --bg: #f8fafc;
  --panel: #ffffff;
  --muted: #6b7280;
  --text: #0f172a;
  --chip: #eef2ff;
  --border: #e5e7eb;
  --blue-200: #bfdbfe;
  --blue-300: #93c5fd;
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    sans-serif;
}
header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(160%) blur(8px);
  border-bottom: 1px solid var(--border);
}
.bar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
}
.brand {
  font-family: Poppins, Inter, sans-serif;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.pill {
  background: var(--chip);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
}
.country-row {
  display: flex;
  gap: 0.5rem;
  overflow: auto;
  padding: 0 0.75rem 0.75rem 1rem;
}
.chip {
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}
.chip:hover {
  border-color: #bfdbfe;
  box-shadow: 0 0 0 2px #e0f2fe inset;
}
.app {
  display: grid;
  grid-template-columns: 360px 1fr;
  min-height: calc(100vh - 92px);
}
@media (max-width: 1024px) {
  .app {
    grid-template-columns: 1fr;
  }
  .side {
    order: 2;
    height: auto;
  }
  .map-pane {
    order: 1;
    height: 70vh;
  }
}
.side {
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 1rem;
  overflow: auto;
}
.side h3 {
  margin: 0.25rem 0 0.5rem;
  font-size: 1rem;
  color: #334155;
}
.group {
  margin-bottom: 1rem;
}
label {
  display: block;
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0.35rem 0;
}
input,
select {
  width: 100%;
  background: #f9fafb;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
}
.chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f9fafb;
  border: 1px solid var(--border);
  color: #0f172a;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
}
.btn:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}
.btn.primary {
  background: linear-gradient(90deg, #e0f2fe, #eef2ff);
  border-color: #bfdbfe;
}
.map-pane {
  position: relative;
}
.footer {
  padding: 0.75rem 1rem;
  color: var(--muted);
  font-size: 0.85rem;
  border-top: 1px solid var(--border);
  background: #ffffff;
}
a {
  color: var(--blue-600);
  text-decoration: none;
}
.checkchip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #eff6ff;
  cursor: pointer;
  user-select: none;
}
.checkchip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.checkchip.active {
  border-color: #c7d2fe;
  box-shadow: 0 0 0 2px #e0e7ff inset;
}
.price-wrap {
  margin-top: 0.5rem;
}
.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.price-col {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 0.6rem;
}
.price-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}
.tag {
  font-weight: 600;
  color: #334155;
}
.val {
  font-size: 0.85rem;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid var(--border);
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;
}
.hint {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.85rem;
}
.price-col input[type='range'] {
  width: 100%;
}
@keyframes pulseRing {
  0% {
    stroke-width: 3;
    stroke-opacity: 1;
  }
  50% {
    stroke-width: 7;
    stroke-opacity: 0.55;
  }
  100% {
    stroke-width: 3;
    stroke-opacity: 1;
  }
}
.pulse-ring {
  animation: pulseRing 2s ease-in-out infinite;
}
@keyframes pinPulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(37, 99, 235, 0));
  }
  50% {
    transform: scale(1.12);
    filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.55));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(37, 99, 235, 0));
  }
}
.pulse-pin {
  animation: pinPulse 1.8s ease-in-out infinite;
  transform-origin: center bottom;
}
.marker-cluster {
  background: radial-gradient(circle at 30% 30%, #e5effe 0%, #cfe3ff 55%, #a9cdfd 100%) !important;
  border: 2px solid #93c5fd !important;
  border-radius: 50% !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.marker-cluster div {
  background: transparent !important;
  border-radius: 50% !important;
  font-family:
    'Nunito',
    'Poppins',
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Inter,
    sans-serif !important;
  font-weight: 700 !important;
  color: #1e3a8a !important;
  font-size: 14px !important;
  line-height: normal !important;
  margin: 0 !important;
  padding: 0 !important;
}
.marker-cluster-small {
  width: 36px !important;
  height: 36px !important;
}
.marker-cluster-medium {
  width: 46px !important;
  height: 46px !important;
}
.marker-cluster-large {
  width: 56px !important;
  height: 56px !important;
}
.howto {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  background: #fff;
}
.howto ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.5rem;
}
.howto li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  color: #334155;
  font-size: 0.95rem;
}
.howto .num {
  font-family: Poppins, Inter, sans-serif;
  flex: 0 0 auto;
  min-width: 28px;
  height: 28px;
  border-radius: 0.6rem;
  background: #eef2ff;
  border: 1px solid var(--border);
  display: inline-grid;
  place-items: center;
  font-weight: 700;
}
.howto em {
  font-style: normal;
  color: #64748b;
}
</style>
