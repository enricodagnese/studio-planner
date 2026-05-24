export type TaskQuantityType = 'pagine' | 'ore-video' | 'esercizi' | 'quiz';

export interface Task {
  id: string;
  name: string;
  pages: number; // The quantity value (pages, hours, exercises, quiz count)
  quantityType?: TaskQuantityType; // How to interpret the quantity
  completed: boolean;
  category: 'teoria' | 'esercizi' | 'altro'; // Task categorization column
}

export interface Subject {
  id: string;
  name: string;
  pages: number;
  completed: boolean;
  color: string; // hex or CSS class for custom look
  logo: string;  // Custom representative vector icon key
  description?: string; // General description or course notes
  tasks: Task[]; // List of specific tasks or chapters
}

export interface CalendarItem {
  id: string;
  subjectId?: string; // Links to a Subject if dragged from the list
  taskId?: string;          // For reliable sync with subject task completion
  name: string; // The task display name (without subject prefix)
  pages?: number; // Quantity value
  quantityType?: TaskQuantityType; // How to display the quantity
  eventType?: 'esame' | 'svago' | 'lezione';   // For extra calendar events
  completed: boolean;
}

export interface DaySchedule {
  id: string; // e.g. "lun-25"
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
