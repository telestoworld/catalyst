import { EthAddress } from 'tcl-crypto'

export type WearableMetadata = {
  id: WearableId
  description: string
  thumbnail: string
  image?: string
  collectionAddress?: EthAddress
  rarity: Rarity
  i18n: I18N[]
  data: WearableMetadataData
  metrics?: Metrics
  createdAt: number
  updatedAt: number
}

export type WearableMetadataRepresentation = {
  bodyShapes: WearableBodyShape[]
  mainFile: string
  contents: string[]
  overrideHides: WearableCategory[]
  overrideReplaces: WearableCategory[]
}

type WearableMetadataData = {
  replaces: WearableCategory[]
  hides: WearableCategory[]
  tags: string[]
  representations: WearableMetadataRepresentation[]
  category: WearableCategory
}
type WearableBodyShape = WearableId
type WearableCategory = string
type Rarity = string
export type I18N = {
  code: LanguageCode
  text: string
}
type Metrics = {
  triangles: number
  materials: number
  textures: number
  meshes: number
  bodies: number
  entities: number
}

type LanguageCode = string

export type Wearable = Omit<WearableMetadata, 'data'> & { data: WearableData }
type WearableData = Omit<WearableMetadataData, 'representations'> & { representations: WearableRepresentation[] }
export type WearableRepresentation = Omit<WearableMetadataRepresentation, 'contents'> & {
  contents: { key: string; url: string }[]
}

export type WearableId = string // These ids are used as pointers on the content server

export type WearablesFilters = {
  collectionIds?: string[]
  wearableIds?: string[]
  textSearch?: string
}

export type WearablesPagination = {
  offset: number
  limit: number
  moreData?: boolean
}
