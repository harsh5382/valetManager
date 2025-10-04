// types.ts
import { Timestamp } from "firebase/firestore";

export type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location?: string;
  startTime: string;
  endTime: string;
  payment: string;
  startDate?: Timestamp;
};
