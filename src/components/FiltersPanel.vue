<script setup lang="ts">
import { reactive } from 'vue'
import { withFlag } from '../utils/flags'

const props = defineProps<{
  countries: string[]
  selectedCountry: string
  selectedDifficulties: string[]
  priceMin: number
  priceMax: number
  keyword: string
}>()
const emit = defineEmits<{
  (e:'update-filters', payload:any): void
  (e:'focus-country', country:string): void
}>()

const local = reactive({
  country: props.selectedCountry || '',
  difficulties: new Set(props.selectedDifficulties || ['Beginner','Intermediate','Advanced']),
  priceMin: props.priceMin ?? 0,
  priceMax: props.priceMax ?? 300,
  keyword: props.keyword || ''
})

function toggleDiff(v:string){
  if (local.difficulties.has(v)) local.difficulties.delete(v)
  else local.difficulties.add(v)
  push()
}
function normalizePrice(){
  if (local.priceMin > local.priceMax){
    const t = local.priceMin; local.priceMin = local.priceMax; local.priceMax = t
  }
}
function push(){
  normalizePrice()
  emit('update-filters', {
    country: local.country,
    difficulties: Array.from(local.difficulties),
    priceMin: Number(local.priceMin),
    priceMax: Number(local.priceMax),
    keyword: local.keyword.trim()
  })
}
function clearAll(){
  local.country = ''
  local.difficulties = new Set(['Beginner','Intermediate','Advanced'])
  local.priceMin = 0; local.priceMax = 300
  local.keyword = ''
  push()
}
function focusCountry(c:string){ local.country = c; push(); emit('focus-country', c) }
</script>

<template>
  <div>
    <div class="group">
      <h3>🔎 Search</h3>
      <input :value="local.keyword" @input="e=>{local.keyword=(e.target as HTMLInputElement).value;push()}" placeholder="Search resorts or countries... (Enter)" />
    </div>

    <div class="group">
      <h3>🎯 Filters</h3>
      <label>Country</label>
      <select v-model="local.country" @change="push">
        <option value="">All</option>
        <option v-for="c in countries" :key="c" :value="c">{{ withFlag(c) }}</option>
      </select>

      <div style="margin-top:.5rem">
        <label>Difficulty (multi-select)</label>
        <div id="diffChips" class="chips">
          <label class="checkchip" :class="{active: local.difficulties.has('Beginner')}" @click="toggleDiff('Beginner')"><input type="checkbox" value="Beginner" :checked="local.difficulties.has('Beginner')">Beginner</label>
          <label class="checkchip" :class="{active: local.difficulties.has('Intermediate')}" @click="toggleDiff('Intermediate')"><input type="checkbox" value="Intermediate" :checked="local.difficulties.has('Intermediate')">Intermediate</label>
          <label class="checkchip" :class="{active: local.difficulties.has('Advanced')}" @click="toggleDiff('Advanced')"><input type="checkbox" value="Advanced" :checked="local.difficulties.has('Advanced')">Advanced</label>
        </div>
      </div>

      <div class="price-wrap">
        <label>Day ticket (USD)</label>
        <div class="price-grid">
          <div class="price-col">
            <div class="price-head"><span class="tag">Min</span><span class="val">{{local.priceMin}}</span></div>
            <input type="range" min="0" max="300" step="10" v-model.number="local.priceMin" @input="push" />
          </div>
          <div class="price-col">
            <div class="price-head"><span class="tag">Max</span><span class="val">{{local.priceMax}}</span></div>
            <input type="range" min="0" max="300" step="10" v-model.number="local.priceMax" @input="push" />
          </div>
        </div>
        <div class="hint">Drag <strong>Min</strong> and <strong>Max</strong> to set the price range; <strong>0–300</strong> means "<strong>Any</strong>".</div>
      </div>

      <div class="chips" style="margin-top:.75rem">
        <button class="btn" @click="clearAll">Clear</button>
      </div>
    </div>

    <div class="group">
      <h3>🧭 Quick Jump</h3>
      <div id="countryList" class="chips">
        <button class="btn" v-for="c in countries" :key="c" @click="focusCountry(c)">{{ withFlag(c) }}</button>
      </div>
    </div>
  </div>
</template>