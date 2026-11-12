export type ItemKind = "normal" | "work" | "fly" | "meet" | "charge";
export type StayStatus = "booked" | "tbd" | "road";

export interface SceneSpec { type: "hills" | "dunes" | "saguaro" | "city" | "coast" | "camp" | "road" | "studio"; tod: "night" | "dawn" | "day" | "golden" | "dusk" }

export interface Place { q: string; dir?: boolean }

export interface Member {
  id: string; short: string; name: string; color: string; // token name, e.g. "c1"
  span: string; // e.g. "全程" or "11/14–1/14"
}

export interface Item { id: string; t: string; title: string; note?: string; kind?: ItemKind; place?: Place }

export interface Stay { name: string; sub: string; status: StayStatus; place?: Place }

export interface Day {
  date: string;        // ISO yyyy-mm-dd
  title: string;
  tz: string;
  work?: string;       // short label for a fixed work commitment
  where: Record<string, string | null>; // memberId -> text; null = not joined yet; text starting with "@" = away
  items: Item[];
  tip?: string;
  stay: Stay;
  route?: string[];     // 当天依次经过的站点 id（stops 里的），用来算行车里程
  scene: SceneSpec;
  place: string;       // 当天所在地，画面上的大字
}

export interface Stop { id: string; name: string; label: string; lat: number; lng: number; region?: string; mark?: string }

export interface Anchor { date: string; title: string; note?: string; kind: "work" | "end" }

export interface Trip {
  id: string;
  name: string;
  tagline: string;
  start: string; end: string;
  cover: string; // hue token
  members: Member[];
  stops: Stop[];
  regions: { id: string; name: string }[];
  guides: { lng: number; label: string }[];
  days: Day[];
  later: { from: string; anchors: Anchor[]; where: Record<string, string> };
  vehicle?: { name: string; rangeMi: number; ev: boolean };
  updated: string;
  demo?: boolean;
}
