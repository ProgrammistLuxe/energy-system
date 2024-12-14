import { Moment } from 'moment';

export interface DateTimeRangeControlValue {
  start: Moment | null;
  end: Moment | null;
}
