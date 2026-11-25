import type { Sprite } from '../kit'
import { archive, assembly, court, dormitory, launchPad, missionControl, payloadBay, supplierDock } from './landmarks'
import { constructionSite } from './districtLooks'

/**
 * The first generation's landmarks a place can stand as (ISSUE-9: its buildings were the
 * beautiful part; bring them over, one class at a time). The frame draws the landmark scaled into the
 * place's footprint; which place stands as which is content's call, and says what the landmark means there.
 * A landmark drawn here shows nothing that is not read: the launch pad stands empty until a reading puts
 * a vehicle on it.
 */
export type LandmarkId = 'launchPad' | 'archive' | 'missionControl' | 'supplierDock' | 'court' | 'dormitory' | 'assembly' | 'payloadBay' | 'site'

/** Each landmark's footprint in cells (n×n) and how tall it stands (px at that footprint), and how it is drawn. */
export const LANDMARKS: Record<LandmarkId, { n: number; height: number; make: () => Sprite }> = {
  launchPad: { n: 4, height: 250, make: () => launchPad(true) },
  archive: { n: 2, height: 88, make: archive },
  missionControl: { n: 4, height: 110, make: missionControl },
  supplierDock: { n: 2, height: 60, make: () => supplierDock() },
  court: { n: 4, height: 140, make: court },
  dormitory: { n: 2, height: 105, make: () => dormitory(0) },
  assembly: { n: 4, height: 215, make: assembly },
  payloadBay: { n: 2, height: 80, make: () => payloadBay() },
  // What did not fit its level (work to do: decouple or merge), LAW-11.
  site: { n: 4, height: 110, make: constructionSite },
}
