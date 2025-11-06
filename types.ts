
export enum UserRole {
  Student = 'Student',
  Teacher = 'Teacher',
}

export enum StudentRole {
  Regular = 'Regular',
  Governor = 'Governor',
  AssistantGovernor = 'Assistant Governor',
}

export interface Course {
  id: string;
  name: string;
  code: string;
  teacherId: string;
}

export interface User {
  id: string;
  name: string; // This will be a concatenation of first and last names for display
  role: UserRole;
  email: string;
  studentNumber: string;
  phone: string;
  surname: string;
  firstName: string;
  otherNames?: string;
  profilePictureUrl?: string;
  bio?: string;
  courseIds: string[];
  username: string;
  password: string;
  studentRole?: StudentRole;
}

export enum TaskStatus {
    Pending = 'Pending',
    Submitted = 'Submitted',
    Graded = 'Graded',
}

export interface Submission {
  studentId: string;
  studentName: string;
  file?: File;
  submittedAt: Date;
  grade?: string;
  feedback?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  submissions: Submission[];
}

export interface AssignmentTemplate {
  id:string;
  name: string; // e.g., "Weekly Research Paper Template"
  title: string; // The default title for the assignment, e.g., "Weekly Research Paper"
  description: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export interface VideoUpload {
    id: string;
    studentId: string;
    studentName: string;
    title: string;
    videoFile: File;
    uploadedAt: Date;
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
}
