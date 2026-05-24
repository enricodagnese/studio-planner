export interface Task {
  id: string;
  name: string;
  pages: number;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  pages: number;
  completed: boolean;
  color: string; // hex or CSS class for custom look
  tasks: Task[]; // List of specific tasks or chapters
}

export interface CalendarItem {
  id: string;
  subjectId?: string; // Links to a Subject if dragged from the list
  name: string; // The display name
  pages?: number; // Optional number of pages for this slot
  completed: boolean;
}

export interface DaySchedule {
  id: string; // e.g. "lunedì-25"
  name: string; // e.g. "Lunedì 25"
  dateLabel: string; // e.g. "25 Mag"
  mattina: CalendarItem[];
  pomeriggio: CalendarItem[];
  sera: CalendarItem[];
}

export interface WeekPlan {
  id: string;
  name: string; // e.g. "Settimana 1: 25 Mag - 31 Mag"
  days: DaySchedule[];
}

export interface PlannerState {
  weeks: WeekPlan[];
  subjects: Subject[];
  activeWeekId: string;
}
