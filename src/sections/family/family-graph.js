import dagre from '@dagrejs/dagre';

// ----------------------------------------------------------------------
// The gods' family (backend `family` visual): people + unions (partners → children).
// Everything here is plain data work shared by the full tree and the small branch.

export const GROUP_COLORS = {
  primordial: '#8E33FF',
  titan: '#FFAB00',
  olympian: '#5B54E8',
  god: '#00B8D9',
  mortal: '#FF5630',
};

export const GROUP_LABELS = {
  primordial: { en: 'Primordial', mn: 'Анхдагч' },
  titan: { en: 'Titans', mn: 'Титанууд' },
  olympian: { en: 'Olympians', mn: 'Олимпийн бурхад' },
  god: { en: 'Other gods', mn: 'Бусад бурхад' },
  mortal: { en: 'Mortals & heroes', mn: 'Хүмүүс, баатрууд' },
};

export const unionId = (i) => `u${i}`;

/** Lookup tables for one family. */
export function indexFamily(family) {
  const people = new Map(family.people.map((p) => [p.id, p]));
  const unions = family.unions.map((u, i) => ({ ...u, id: unionId(i) }));
  const birthOf = new Map(); // person → the union they were born of
  const unionsOf = new Map(); // person → unions they are a partner in
  unions.forEach((u) => {
    u.children.forEach((c) => birthOf.set(c, u));
    u.partners.forEach((p) => unionsOf.set(p, [...(unionsOf.get(p) ?? []), u]));
  });
  return { people, unions, birthOf, unionsOf };
}

/** A person's immediate family: parents, siblings, partners (with their children), spouses. */
export function relativesOf(index, id) {
  const birth = index.birthOf.get(id) ?? null;
  const own = index.unionsOf.get(id) ?? [];
  const person = index.people.get(id);
  return {
    birth,
    parents: birth?.partners ?? [],
    siblings: (birth?.children ?? []).filter((c) => c !== id),
    unions: own,
    partners: [...new Set(own.flatMap((u) => u.partners).filter((p) => p !== id))],
    children: [...new Set(own.flatMap((u) => u.children))],
    spouses: person?.spouses ?? [],
  };
}

/** Ids (people + unions) to highlight when `id` is selected. */
export function highlightOf(index, id) {
  if (!id) return null;
  const r = relativesOf(index, id);
  const ids = new Set([
    id,
    ...r.parents,
    ...r.siblings,
    ...r.partners,
    ...r.children,
    ...r.spouses,
  ]);
  if (r.birth) ids.add(r.birth.id);
  r.unions.forEach((u) => ids.add(u.id));
  return ids;
}

export const NODE_W = 128;
export const NODE_H = 58;
const UNION_SIZE = 10;

/**
 * Layered layout via dagre. Each union is a small dot between its partners and
 * its children, so couples sit side by side and children hang from their
 * couple; partners whose parents aren't shown land on their partner's row.
 */
export function layoutFamily(index) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 18, ranksep: 42, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  index.people.forEach((p) => g.setNode(p.id, { width: NODE_W, height: NODE_H }));
  index.unions.forEach((u) => {
    g.setNode(u.id, { width: UNION_SIZE, height: UNION_SIZE });
    u.partners.forEach((p) => g.setEdge(p, u.id, { weight: 3 }));
    u.children.forEach((c) => g.setEdge(u.id, c, { weight: 1 }));
  });
  dagre.layout(g);

  const positions = new Map();
  g.nodes().forEach((id) => {
    const n = g.node(id);
    positions.set(id, { x: n.x - n.width / 2, y: n.y - n.height / 2 });
  });
  return positions;
}
