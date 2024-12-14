import { LatLngExpression, Polyline, PolylineOptions } from 'leaflet';
import { LineOptions } from './line-data';
export class Line extends Polyline {
  override options: LineOptions;
  constructor(
    latlngs: LatLngExpression[][],
    options?: LineOptions,
    public props?: Record<string, any>,
  ) {
    super(latlngs, options);
  }
}
