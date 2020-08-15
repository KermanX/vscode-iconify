import { workspace } from 'vscode'
import { reactive, computed, ref } from '@vue/reactivity'
import { EXT_NAMESPACE } from './meta'
import { collectionIds } from './collections'

const _configState = ref(0)

function getConfig<T = any>(key: string): T | undefined {
  return workspace
    .getConfiguration()
    .get<T>(key)
}

async function setConfig(key: string, value: any, isGlobal = true) {
  // update value
  return await workspace
    .getConfiguration()
    .update(key, value, isGlobal)
}

function createConfigRef<T>(key: string, defaultValue: T, isGlobal = true) {
  return computed({
    get: () => {
      // to force computed update
      // eslint-disable-next-line
      _configState.value
      return getConfig<T>(key) ?? defaultValue
    },
    set: (v) => {
      setConfig(key, v, isGlobal)
    },
  })
}

export const config = reactive({
  inplace: createConfigRef(`${EXT_NAMESPACE}.inplace`, true),
  annonations: createConfigRef(`${EXT_NAMESPACE}.annonations`, true),
  color: createConfigRef(`${EXT_NAMESPACE}.color`, 'auto'),
  delimiter: createConfigRef(`${EXT_NAMESPACE}.delimiter`, ':'),
  includes: createConfigRef<string[] | null>(`${EXT_NAMESPACE}.includes`, null),
  excludes: createConfigRef<string[] | null>(`${EXT_NAMESPACE}.excludes`, null),
  fontSize: createConfigRef('editor.fontSize', 12),
})

export const enabledCollections = computed(() => {
  const includes = config.includes?.length ? config.includes : collectionIds
  const excludes = config.excludes || []

  return includes.filter(i => !excludes.includes(i))
})

export const color = computed(() => {
  // TODO: based on current theme
  return config.color === 'auto' ? '#fff' : config.color
})

export const REGEX_NAMESPACE = computed(() => {
  return new RegExp(`[^\\w\\d](?:${enabledCollections.value.join('|')})${config.delimiter}`)
})

export const REGEX_FULL = computed(() => {
  return new RegExp(`[^\\w\\d]((?:${enabledCollections.value.join('|')})${config.delimiter}[\\w-]+)`, 'g')
})

export function onConfigUpdated() {
  _configState.value = +new Date()
}
