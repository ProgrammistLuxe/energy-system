import { Moment } from 'moment';

export interface DateTimeFormValue {
  startDate: Moment | null;
  startTime: string | null;
  endDate: Moment | null;
  endTime: string | null;
}
