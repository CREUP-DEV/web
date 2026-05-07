import regionPaths from './spainRegions.json'

export interface SpainRegionPath {
  svgId: string
  community: string
  d: string
}

export const SPAIN_REGION_PATHS = regionPaths as SpainRegionPath[]
