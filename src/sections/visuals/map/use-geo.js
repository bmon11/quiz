import useSWR from 'swr';
import { feature } from 'topojson-client';

import { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

/** The API's TopoJSON maps (maps/<name>.json) as GeoJSON features, fetched once per name. */
export function useGeo(name) {
  const { data, error } = useSWR(name ? `/maps/${name}.json` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  const features = data?.objects?.regions ? feature(data, data.objects.regions).features : null;
  return { features, geoError: error };
}

export const MAP_CREDITS = {
  mongolia: '© OpenStreetMap contributors (ODbL) · geoBoundaries',
  world: 'Natural Earth',
};
