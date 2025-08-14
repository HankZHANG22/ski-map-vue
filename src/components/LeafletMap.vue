<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { Resort } from '../data/resorts'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

import * as L from 'leaflet'
import 'leaflet.markercluster'

declare global {
  interface Window {
    __FOCUS_RESORT?: (id: number) => void
  }
}

const props = defineProps<{
  resorts: Resort[]
  filtered: Resort[]
  flagMap: Record<string, string>
}>()

const WORLD_VIEW = { center: [20, 0] as [number, number], zoom: 2 }
const DIFF_COLOR: Record<string, string> = {
  Beginner: '#93c5fd',
  Intermediate: '#60a5fa',
  Advanced: '#2563eb',
}

const map = ref<L.Map | null>(null)
const cluster = ref<L.MarkerClusterGroup | null>(null)
const markersById = new Map<number, L.Marker>()
let pulsingIconEl: HTMLElement | null = null

// 监听容器尺寸（防止父布局变化后地图没刷新）
let ro: ResizeObserver | null = null

function iconFor(diff: string) {
  const color = DIFF_COLOR[diff] || '#60a5fa'
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36'>
      <g><path d='M12 0C5.4 0 0 5.4 0 12c0 8.8 12 24 12 24s12-15.2 12-24C24 5.4 18.6 0 12 0z' fill='${color}'/></g>
    </svg>`,
  )
  return L.divIcon({
    className: 'pin-root',
    html: `<div class="pin-wrap"><img class="pin-img" src="data:image/svg+xml,${svg}" alt="pin"/></div>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -30],
  })
}

function popupHTML(r: Resort) {
  const flag = props.flagMap?.[r.country] ? `${props.flagMap[r.country]} ${r.country}` : r.country
  const id = `w-${r.id}`
  return `
    <div style="min-width:240px">
      <div style="font-weight:700;margin-bottom:.25rem">${r.name}</div>
      <div style="font-size:.9rem;color:#475569;margin-bottom:.25rem">${flag} · ${r.difficulty} · $${r.price}</div>
      <div style="margin-bottom:.4rem;line-height:1.5">${r.info || ''}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.35rem 0 .5rem">
        <a class="btn primary" href="${r.ticket_url}" target="_blank" rel="noopener">🎟️ Tickets / Website</a>
        <button class="btn" onclick="window.__FOCUS_RESORT && window.__FOCUS_RESORT(${r.id})">📍 Focus</button>
      </div>
      <div id="${id}" style="font-size:.9rem;color:#475569">⛅ Loading weather...</div>
    </div>`
}

function addPulseToMarker(marker: L.Marker) {
  if (pulsingIconEl) pulsingIconEl.classList.remove('pulse-pin')
  const root = marker.getElement?.() ?? (marker as L.Marker & { _icon?: HTMLElement })._icon ?? null
  const img = (root?.querySelector?.('.pin-img') ?? null) as HTMLElement | null
  if (img) {
    img.classList.add('pulse-pin')
    pulsingIconEl = img
  }
}

function renderMarkers(data: Resort[]) {
  const cl = cluster.value
  if (!cl) return
  cl.clearLayers()
  markersById.clear()

  data.forEach((r) => {
    const m = L.marker([r.lat, r.lng], { icon: iconFor(r.difficulty) }).bindPopup(popupHTML(r))
    m.on('click', () => addPulseToMarker(m))
    m.on('popupopen', () => {
      addPulseToMarker(m)
      loadWeather(r.lat, r.lng, `w-${r.id}`)
    })
    m.on('popupclose', () => {
      const root = m.getElement?.() ?? (m as L.Marker & { _icon?: HTMLElement })._icon ?? null
      const img = (root?.querySelector?.('.pin-img') ?? null) as HTMLElement | null
      if (img) {
        img.classList.remove('pulse-pin')
        if (pulsingIconEl === img) pulsingIconEl = null
      }
    })
    cl.addLayer(m)
    markersById.set(r.id, m)
  })
}

function fitTo(data: Resort[]) {
  const m = map.value
  if (!m) return
  if (!data.length) {
    m.setView(WORLD_VIEW.center, WORLD_VIEW.zoom)
    return
  }
  const group = L.featureGroup(data.map((r) => L.marker([r.lat, r.lng])))
  m.fitBounds(group.getBounds().pad(0.2))
}

/** ===== 把浮层改为 Leaflet 控件（不会卡位） ===== */
function addLocateControl(m: L.Map) {
  const Locate = L.Control.extend({
    options: { position: 'bottomleft' as L.ControlPosition },
    onAdd() {
      const c = L.DomUtil.create('div', 'leaflet-control custom-card')
      const btn = L.DomUtil.create('button', 'btn', c)
      btn.textContent = 'Locate Me'
      L.DomEvent.disableClickPropagation(btn)
      L.DomEvent.disableScrollPropagation(btn)
      btn.onclick = () => locate()
      return c
    },
  })
  m.addControl(new Locate())
}

function addLegendControl(m: L.Map) {
  const Legend = L.Control.extend({
    options: { position: 'topright' as L.ControlPosition },
    onAdd() {
      const wrap = L.DomUtil.create('div', 'leaflet-control custom-card legend-card')
      wrap.innerHTML = `
        <div class="legend-title">Difficulty</div>
        <div class="legend-row">
          <span class="dot easy"></span><span>Beginner</span>
          <span class="dot mid"></span><span>Intermediate</span>
          <span class="dot hard"></span><span>Advanced</span>
        </div>`
      L.DomEvent.disableClickPropagation(wrap)
      L.DomEvent.disableScrollPropagation(wrap)
      return wrap
    },
  })
  m.addControl(new Legend())
}
/** ================================================= */

onMounted(() => {
  const m = L.map('map', { worldCopyJump: true })
  map.value = m
  m.setView(WORLD_VIEW.center, WORLD_VIEW.zoom)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
  }).addTo(m)

  const cl = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 12,
  })
  cluster.value = cl
  cl.addTo(m)

  // ✅ 固定在地图边角的控件
  addLocateControl(m)
  addLegendControl(m)

  window.__FOCUS_RESORT = (id: number) => focusResort(id)

  const host = document.querySelector('.map-host') as HTMLElement | null
  if (host && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => map.value?.invalidateSize())
    ro.observe(host)
  }

  const initData = props.filtered?.length ? props.filtered : props.resorts
  renderMarkers(initData)
  fitTo(initData)
})

watch(
  () => props.filtered,
  (nv) => {
    const m = map.value
    if (!m) return
    renderMarkers(nv)
    fitTo(nv)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (ro) {
    ro.disconnect()
    ro = null
  }
  if (window.__FOCUS_RESORT) delete window.__FOCUS_RESORT
  const m = map.value
  if (m) {
    m.off()
    m.remove()
  }
  map.value = null
  cluster.value = null
})

// ===== Weather =====
function cacheKey(lat: number, lng: number) {
  return `owm_${lat.toFixed(3)}_${lng.toFixed(3)}`
}

async function fetchWeather(lat: number, lng: number) {
  const key = import.meta.env.VITE_OWM_API_KEY
  if (!key) throw new Error('Missing OWM key')
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=en&appid=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Network')
  return res.json() as Promise<unknown>
}

function renderWeather(d: unknown) {
  const obj = typeof d === 'object' && d !== null ? (d as Record<string, unknown>) : {}
  const main =
    typeof obj.main === 'object' && obj.main !== null ? (obj.main as Record<string, unknown>) : {}
  const weatherArr = Array.isArray(obj.weather)
    ? (obj.weather as Array<Record<string, unknown>>)
    : []
  const wind =
    typeof obj.wind === 'object' && obj.wind !== null ? (obj.wind as Record<string, unknown>) : {}
  const snow =
    typeof obj.snow === 'object' && obj.snow !== null ? (obj.snow as Record<string, unknown>) : {}

  const t = typeof main.temp === 'number' ? (main.temp as number) : undefined
  const desc =
    typeof weatherArr[0]?.description === 'string' ? (weatherArr[0].description as string) : ''
  const windSpd = typeof wind.speed === 'number' ? (wind.speed as number) : undefined
  const snow1h = typeof snow['1h'] === 'number' ? (snow['1h'] as number) : undefined
  const snow3h = typeof snow['3h'] === 'number' ? (snow['3h'] as number) : undefined

  const parts: string[] = []
  if (typeof t === 'number') parts.push(`Temp ${t.toFixed(0)}°C`)
  if (desc) parts.push(desc)
  if (typeof windSpd === 'number') parts.push(`Wind ${windSpd} m/s`)
  if (typeof snow1h === 'number') parts.push(`Snow 1h ${snow1h} mm`)
  if (typeof snow3h === 'number') parts.push(`Snow 3h ${snow3h} mm`)
  return parts.length ? '⛅ ' + parts.join(' · ') : 'No weather data'
}

async function loadWeather(lat: number, lng: number, elId: string) {
  const el = document.getElementById(elId)
  if (!el) return
  const key = cacheKey(lat, lng)
  const now = Date.now()
  try {
    const cachedRaw = localStorage.getItem(key)
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { t: number; d: unknown } | null
      if (cached && typeof cached.t === 'number' && now - cached.t < 15 * 60 * 1000) {
        el.innerHTML = renderWeather(cached.d)
        return
      }
    }
  } catch {}
  try {
    const data = await fetchWeather(lat, lng)
    el.innerHTML = renderWeather(data)
    try {
      localStorage.setItem(key, JSON.stringify({ t: now, d: data }))
    } catch {}
  } catch {
    el.innerHTML = 'Weather unavailable'
  }
}

// Expose
function focusResort(id: number) {
  const m = map.value
  const mk = markersById.get(id)
  if (mk && m) {
    m.setView(mk.getLatLng(), 12, { animate: true })
    mk.openPopup()
    addPulseToMarker(mk)
  }
}
function locate() {
  const m = map.value
  if (!(m instanceof L.Map) || !navigator.geolocation) {
    alert('Geolocation not supported')
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      m.setView([latitude, longitude], 9)
      L.circleMarker([latitude, longitude], {
        radius: 10,
        color: '#2563eb',
        weight: 3,
        fill: false,
        className: 'pulse-ring',
      })
        .addTo(m)
        .bindPopup('You are here')
        .openPopup()
    },
    () => {
      alert('Failed to locate. Tip: allow permission or use HTTPS/localhost.')
    },
  )
}
function fitToCountry(country: string) {
  const m = map.value
  if (!m) return
  const items = (props.resorts || []).filter((r) => r.country === country)
  if (!items.length) return
  const group = L.featureGroup(items.map((r) => L.marker([r.lat, r.lng])))
  m.fitBounds(group.getBounds().pad(0.25))
}
function fitToAll() {
  const m = map.value
  if (m) m.setView(WORLD_VIEW.center, WORLD_VIEW.zoom)
}

defineExpose({ locate, focusResort, fitToCountry, fitToAll })
</script>

<template>
  <div class="map-host">
    <div id="map"></div>
  </div>
</template>

<style>
/* 容器铺满，控件由 Leaflet 自己定位 */
.map-host {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
}
#map {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 统一控件外观：白色圆角卡片 */
.leaflet-control.custom-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
  font-size: 0.9rem;
  color: #334155;
}

/* Legend 内容 */
.legend-title {
  margin-bottom: 0.25rem;
  font-weight: 600;
}
.legend-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
  align-items: center;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.easy {
  background: #93c5fd;
}
.dot.mid {
  background: #60a5fa;
}
.dot.hard {
  background: #2563eb;
}

/* 防止动画覆盖 Leaflet 定位 transform */
.pin-root {
  will-change: transform;
}
.pin-wrap {
  display: grid;
  place-items: center;
}
.pin-img {
  display: block;
}

/* 呼吸动画（只给内层 img） */
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

/* 定位蓝色呼吸环（沿用你之前的动画关键帧） */
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
</style>
