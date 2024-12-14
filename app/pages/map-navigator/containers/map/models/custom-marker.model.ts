import { LatLngExpression, Marker, MarkerOptions } from 'leaflet';
import { CustomMarkerOptions } from './marker-data.model';
export class CustomMarker extends Marker {
  override options: CustomMarkerOptions;
  constructor(
    latlng: LatLngExpression,
    options?: CustomMarkerOptions,
    public props?: Record<string, any>,
  ) {
    super(latlng, options);
  }
}
