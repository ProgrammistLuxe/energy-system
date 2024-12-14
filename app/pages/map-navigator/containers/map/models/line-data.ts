import { LatLng, LatLngExpression, PolylineOptions } from 'leaflet';

export interface LineData {
  position: LatLngExpression[][];
  options?: LineOptions | undefined;
  props?: Record<string, any> | null;
}
export interface LineOptions extends PolylineOptions {
  bounds: LatLng;
  title: string;
  uid?: string | null;
  parentACLine?: string | null;
  parentSection?: string | null;
}
