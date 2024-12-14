import { LatLngLiteral, MarkerOptions } from 'leaflet';

export interface MarkerData {
  position: LatLngLiteral;
  options?: CustomMarkerOptions | undefined;
  props?: Record<string, any> | null;
}
export interface CustomMarkerOptions extends MarkerOptions {
  uid?: string | null;
  parentLineSpan?: string[] | null;
  parentACLineSegment?: string | null;
  bounds: LatLngLiteral;
}
