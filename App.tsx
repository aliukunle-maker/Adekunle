

import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { UserRole, StudentRole, type User, type Assignment, type Quiz, type VideoUpload, type Submission, type Announcement, type Course, type AssignmentTemplate } from './types';
import { DashboardIcon, AssignmentIcon, QuizIcon, VideoIcon, CloseIcon, PlusIcon, StudentsIcon, TrashIcon, CalendarIcon, SunIcon, MoonIcon, BellIcon, TemplateIcon, CogIcon, LogoutIcon, CameraIcon, KeyIcon } from './components/icons';

// --- THEME MANAGEMENT ---
type Theme = 'light' | 'dark';
// FIX: Corrected the type definition for toggleTheme from '() toid' to '() => void'.
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void; }>({ theme: 'light', toggleTheme: () => {} });

// --- PERSISTENCE ---
const LOCAL_STORAGE_KEYS = {
  USERS: 'eduSphere_users',
  COURSES: 'eduSphere_courses',
  ASSIGNMENTS: 'eduSphere_assignments',
  QUIZZES: 'eduSphere_quizzes',
  VIDEOS: 'eduSphere_videos',
  ANNOUNCEMENTS: 'eduSphere_announcements',
  TEMPLATES: 'eduSphere_templates',
  THEME: 'eduSphere_theme',
};

const dateReviver = (key: string, value: any) => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    if (typeof value === 'string' && isoDateRegex.test(value)) {
        return new Date(value);
    }
    return value;
};

function usePersistentState<T>(key: string, initialValue: T, reviver?: (key: string, value: any) => any): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item, reviver) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}


// --- MOCK DATA (for initial load) ---
const MOCK_COURSES: Course[] = [
    { id: 'course1', name: 'Strength of Materials', code: 'CVE-305', teacherId: 'teacher1' },
    { id: 'course2', name: 'Calculus I', code: 'MATH-201', teacherId: 'teacher1' },
    { id: 'course3', name: 'Introduction to Biology', code: 'BIO-101', teacherId: 'teacher1' },
];

const MOCK_STUDENTS: User[] = [
    { id: 'student1', name: 'Alice Johnson', role: UserRole.Student, studentRole: StudentRole.Governor, email: 'alice.j@edu.com', studentNumber: 'S001', phone: '111-222-3333', surname: 'Johnson', firstName: 'Alice', profilePictureUrl: `https://i.pravatar.cc/150?u=student1`, courseIds: ['course2', 'course3'], username: 'alice.j', password: 'password123' },
    { id: 'student2', name: 'Bob Williams', role: UserRole.Student, studentRole: StudentRole.Regular, email: 'bob.w@edu.com', studentNumber: 'S002', phone: '222-333-4444', surname: 'Williams', firstName: 'Bob', profilePictureUrl: `https://i.pravatar.cc/150?u=student2`, courseIds: ['course1'], username: 'bob.w', password: 'password123' },
    { id: 'student3', name: 'Charlie Brown', role: UserRole.Student, studentRole: StudentRole.Regular, email: 'charlie.b@edu.com', studentNumber: 'S003', phone: '333-444-5555', surname: 'Brown', firstName: 'Charlie', profilePictureUrl: `https://i.pravatar.cc/150?u=student3`, courseIds: ['course1', 'course2'], username: 'charlie.b', password: 'password123' },
];

const MOCK_TEACHER: User = { 
    id: 'teacher1', 
    name: 'Dr. Aliu Adekunle', 
    role: UserRole.Teacher,
    email: 'a.adekunle@faculty.edu',
    studentNumber: 'N/A',
    phone: '999-888-7777',
    surname: 'Adekunle',
    firstName: 'Aliu',
    profilePictureUrl: `https://i.pravatar.cc/150?u=teacher1`,
    courseIds: ['course1', 'course2', 'course3'],
    username: 'Adekunle',
    password: 'Opemipo@1'
};

const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: 'assign1',
        courseId: 'course1',
        title: 'History of Ancient Rome',
        description: 'Write a 1000-word essay on the fall of the Roman Empire.',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        submissions: [
             { studentId: 'student2', studentName: 'Bob Williams', submittedAt: new Date(new Date().setDate(new Date().getDate() - 1)), grade: 'B+', feedback: 'Good work, but could use more primary sources.' },
        ],
    },
    {
        id: 'assign2',
        courseId: 'course2',
        title: 'Calculus I: Problem Set 3',
        description: 'Complete the exercises on pages 45-47 of the textbook.',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        submissions: [
            { studentId: 'student1', studentName: 'Alice Johnson', submittedAt: new Date(), grade: 'A-', feedback: 'Excellent problem-solving skills demonstrated.' }
        ],
    },
];

const MOCK_ASSIGNMENT_TEMPLATES: AssignmentTemplate[] = [
    { id: 'template1', name: 'Weekly Essay Template', title: 'Weekly Essay Submission', description: 'Please write a 500-word essay on this week\'s topic. Ensure you cite at least two sources using APA format.' },
    { id: 'template2', name: 'Lab Report Template', title: 'Lab Report', description: 'Complete the following sections for your lab report:\n1. Introduction\n2. Materials & Methods\n3. Results\n4. Discussion\n5. Conclusion' },
];

const MOCK_QUIZZES: Quiz[] = [
    {
        id: 'quiz1',
        courseId: 'course3',
        title: 'Biology Midterm',
        startTime: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTime: new Date(new Date().setDate(new Date().getDate() + 2)),
        durationMinutes: 60,
        questions: [{ question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome'], correctAnswerIndex: 0 }],
    },
];

const MOCK_VIDEOS: VideoUpload[] = [];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'anno1', courseId: 'course1', title: 'Welcome to History!', content: 'Looking forward to a great semester. Please review the syllabus.', author: 'Dr. Aliu Adekunle', createdAt: new Date(new Date().setDate(new Date().getDate() - 2)) },
    { id: 'anno2', courseId: 'course2', title: 'Calculus Midterm Schedule', content: 'The midterm exam will be held next Friday.', author: 'Dr. Aliu Adekunle', createdAt: new Date() },
];


// --- HELPER & LAYOUT COMPONENTS ---

const Sidebar: React.FC<{ viewAsRole: UserRole }> = ({ viewAsRole }) => {
    const navItems = [
        { to: '/', label: 'Dashboard', icon: <DashboardIcon />, roles: [UserRole.Student, UserRole.Teacher] },
        { to: '/assignments', label: 'Assignments', icon: <AssignmentIcon />, roles: [UserRole.Student, UserRole.Teacher] },
        { to: '/quizzes', label: 'Quizzes', icon: <QuizIcon />, roles: [UserRole.Student, UserRole.Teacher] },
        { to: '/calendar', label: 'Calendar', icon: <CalendarIcon />, roles: [UserRole.Student, UserRole.Teacher] },
        { to: '/templates', label: 'Templates', icon: <TemplateIcon />, roles: [UserRole.Teacher] },
        { to: '/students', label: 'Students', icon: <StudentsIcon />, roles: [UserRole.Student, UserRole.Teacher] },
        { to: '/videos', label: 'Video Uploads', icon: <VideoIcon />, roles: [UserRole.Student] },
    ];

    const activeLinkClass = "bg-blue-800 text-white";
    const inactiveLinkClass = "text-blue-100 hover:bg-blue-600 hover:text-white";

    const isAuthorized = (itemRoles: UserRole[]) => {
        if (viewAsRole === UserRole.Teacher) {
            return itemRoles.includes(UserRole.Teacher);
        }
        // This is complex because Students page is visible to some students. We'll handle inside the component.
        if (location.pathname === '/students') return true; 

        return itemRoles.includes(UserRole.Student);
    };

    return (
        <div className="w-64 bg-blue-700 text-white flex-col min-h-screen p-4 hidden md:flex">
            <div className="text-2xl font-bold mb-10 text-center">EduSphere</div>
            <nav className="flex flex-col space-y-2">
                {navItems
                    .filter(item => isAuthorized(item.roles))
                    .map(item => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
            </nav>
        </div>
    );
};

const ProfileMenu: React.FC<{ user: User; onLogout: () => void; onPictureChange: (file: File) => void }> = ({ user, onLogout, onPictureChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onPictureChange(event.target.files[0]);
        }
    };

    return (
        <div className="absolute top-16 right-0 w-56 mt-2 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="py-1">
                <div className="px-4 py-3 border-b dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <CameraIcon className="mr-3" />
                    Change Picture
                </button>
                <button
                    onClick={onLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <LogoutIcon className="mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

const Header: React.FC<{ 
    loggedInUser: User;
    onLogout: () => void;
    onProfilePictureChange: (file: File) => void;
    viewAsRole: UserRole;
    setViewAsRole: (role: UserRole) => void;
    courses: Course[];
    selectedCourseId: string | null;
    onCourseChange: (courseId: string) => void;
    onManageCourses: () => void;
}> = ({ loggedInUser, onLogout, onProfilePictureChange, viewAsRole, setViewAsRole, courses, selectedCourseId, onCourseChange, onManageCourses }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const pageTitle = location.pathname.replace('/', '').replace(/^\w/, c => c.toUpperCase()) || 'Dashboard';
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const userCourses = useMemo(() => courses.filter(c => loggedInUser.courseIds.includes(c.id)), [courses, loggedInUser]);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
            <div>
                 <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
                 {selectedCourse && <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCourse.name}</p>}
            </div>
            <div className="flex items-center space-x-4">
                 {loggedInUser.role === UserRole.Teacher && (
                    <button onClick={onManageCourses} className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <CogIcon className="h-5 w-5" />
                        <span>Manage Courses</span>
                    </button>
                )}
                <select 
                    value={selectedCourseId || ''} 
                    onChange={(e) => onCourseChange(e.target.value)} 
                    className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    aria-label="Select course"
                >
                    <option value="" disabled>Select a Course</option>
                    {userCourses.map(course => (
                        <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                    ))}
                </select>
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle theme">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <div className="relative">
                    <button onClick={() => setProfileMenuOpen(prev => !prev)} className="flex items-center space-x-3 focus:outline-none">
                        <div className="text-right">
                            <div className="font-semibold text-gray-800 dark:text-gray-100">{loggedInUser.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{loggedInUser.role}</div>
                        </div>
                        <img src={loggedInUser.profilePictureUrl} alt={loggedInUser.name} className="h-10 w-10 rounded-full object-cover" />
                    </button>
                    {isProfileMenuOpen && <ProfileMenu user={loggedInUser} onLogout={onLogout} onPictureChange={onProfilePictureChange} />}
                </div>
                {loggedInUser.role === UserRole.Teacher && (
                     <select value={viewAsRole} onChange={(e) => setViewAsRole(e.target.value as UserRole)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" aria-label="View as role">
                        <option value={UserRole.Teacher}>View as Teacher</option>
                        <option value={UserRole.Student}>View as Student</option>
                    </select>
                )}
            </div>
        </header>
    );
};

// --- REUSABLE UI COMPONENTS ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 bg-white dark:bg-gray-800`}>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const Announcements: React.FC<{
    loggedInUser: User;
    announcements: Announcement[];
    setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
    selectedCourseId: string;
}> = ({ loggedInUser, announcements, setAnnouncements, selectedCourseId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handlePost = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !content) return;
        const newAnnouncement: Announcement = {
            id: `anno${Date.now()}`,
            courseId: selectedCourseId,
            title,
            content,
            author: loggedInUser.name,
            createdAt: new Date(),
        };
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        setTitle('');
        setContent('');
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center"><BellIcon className="mr-2 h-6 w-6"/>Announcements</h3>
            {loggedInUser.role === UserRole.Teacher && (
                <form onSubmit={handlePost} className="mb-6 space-y-3 p-4 border dark:border-gray-700 rounded-lg">
                    <input type="text" placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)} required rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Post</button>
                </form>
            )}
            <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {announcements.length === 0 && <p className="text-gray-500 dark:text-gray-400">No announcements for this course yet.</p>}
                {announcements.map(anno => (
                    <li key={anno.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="font-bold text-gray-800 dark:text-gray-100">{anno.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{anno.content}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">By {anno.author} on {new Date(anno.createdAt).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};


// --- PAGE COMPONENTS ---

const Dashboard: React.FC<{ 
    loggedInUser: User,
    viewAsRole: UserRole,
    assignments: Assignment[], 
    quizzes: Quiz[], 
    students: User[],
    announcements: Announcement[],
    setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>,
    selectedCourseId: string,
}> = ({ loggedInUser, viewAsRole, assignments, quizzes, students, announcements, setAnnouncements, selectedCourseId }) => {
    const studentStats = [
        { title: "Pending Assignments", value: assignments.filter(a => !a.submissions.some(s => s.studentId === loggedInUser.id)).length, icon: <AssignmentIcon />, color: "bg-yellow-100 text-yellow-600" },
        { title: "Active Quizzes", value: quizzes.filter(q => new Date() > new Date(q.startTime) && new Date() < new Date(q.endTime)).length, icon: <QuizIcon />, color: "bg-green-100 text-green-600" },
    ];
    const teacherStats = [
        { title: "Total Students", value: students.length, icon: <StudentsIcon />, color: "bg-purple-100 text-purple-600"},
        { title: "Total Assignments", value: assignments.length, icon: <AssignmentIcon />, color: "bg-blue-100 text-blue-600" },
        { title: "Submissions to Grade", value: assignments.reduce((acc, a) => acc + a.submissions.filter(s => !s.grade).length, 0), icon: <VideoIcon />, color: "bg-pink-100 text-pink-600" },
    ];
    
    const stats = viewAsRole === UserRole.Student ? studentStats : teacherStats;

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome back, {loggedInUser.firstName}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Upcoming Deadlines</h3>
                     {assignments.filter(a => new Date(a.dueDate) > new Date()).length === 0 && <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines.</p>}
                    <ul className="space-y-3">
                        {assignments
                            .filter(a => new Date(a.dueDate) > new Date())
                            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                            .slice(0,3)
                            .map(a => (
                            <li key={a.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{a.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{a.description.substring(0, 50)}...</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-red-600">{new Date(a.dueDate).toLocaleDateString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <Announcements loggedInUser={loggedInUser} announcements={announcements} setAnnouncements={setAnnouncements} selectedCourseId={selectedCourseId} />
            </div>
        </div>
    );
};

const CalendarPage: React.FC<{ assignments: Assignment[], quizzes: Quiz[] }> = ({ assignments, quizzes }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyStartDays = Array.from({ length: startDay }, (_, i) => null);

    const getEventsForDay = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayStart = date.setHours(0,0,0,0);
        const dayEnd = date.setHours(23,59,59,999);

        const dayAssignments = assignments.filter(a => {
            const dueDate = new Date(a.dueDate).getTime();
            return dueDate >= dayStart && dueDate <= dayEnd;
        });
        const dayQuizzes = quizzes.filter(q => {
             const endDate = new Date(q.endTime).getTime();
            return endDate >= dayStart && endDate <= dayEnd;
        });

        return [...dayAssignments, ...dayQuizzes];
    };
    
    return (
        <div className="p-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="text-gray-600 dark:text-gray-300">&lt; Prev</button>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h2>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="text-gray-600 dark:text-gray-300">Next &gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 dark:text-gray-300">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                    {emptyStartDays.map((_, index) => <div key={`empty-${index}`} className="border dark:border-gray-700 rounded-md h-32"></div>)}
                    {days.map(day => {
                        const events = getEventsForDay(day);
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                        return (
                            <div key={day} className={`border dark:border-gray-700 rounded-md h-32 p-2 text-left ${isToday ? 'bg-blue-50 dark:bg-blue-900' : ''}`}>
                                <span className={`font-bold ${isToday ? 'text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>{day}</span>
                                <div className="mt-1 space-y-1 overflow-y-auto max-h-20 text-xs">
                                    {events.map(event => (
                                        <div key={event.id} className={`p-1 rounded ${'dueDate' in event ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const CreateAssignmentModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onCreate: (data: any) => void;
    templates: AssignmentTemplate[];
}> = ({ isOpen, onClose, onCreate, templates }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ title, description, dueDate: new Date(dueDate) });
        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const selectElement = e.target;
        if (!templateId) {
            setTitle('');
            setDescription('');
            return;
        }
        const selectedTemplate = templates.find(t => t.id === templateId);
        if (selectedTemplate) {
            setTitle(selectedTemplate.title);
            setDescription(selectedTemplate.description);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create New Assignment</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-4 space-y-4">
                     <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Use Template (Optional)</label>
                        <select 
                            id="template"
                            onChange={handleTemplateChange}
                            defaultValue=""
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Start from scratch</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button>
                    </div>
                </form>
            </div>
        </div>
    )
};
const AssignmentDetailModal: React.FC<{ assignment: Assignment | null; onClose: () => void; onGrade: (assignmentId: string, studentId: string, grade: string, feedback: string) => void; students: User[] }> = ({ assignment, onClose, onGrade, students }) => {
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [gradingStudent, setGradingStudent] = useState<Submission | null>(null);

    if (!assignment) return null;

    const handleGradeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gradingStudent) {
            onGrade(assignment.id, gradingStudent.studentId, grade, feedback);
            setGradingStudent(null);
            setGrade('');
            setFeedback('');
        }
    };
    
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{assignment.title}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><CloseIcon /></button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">{assignment.description}</p>
            <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-6">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>

            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Submissions</h3>
            <div className="flex-grow overflow-y-auto pr-4">
                <ul className="space-y-3">
                    {assignment.submissions.map(sub => (
                        <li key={sub.studentId} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{sub.studentName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Submitted on: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                            </div>
                            {sub.grade ? (
                                <div className="text-right">
                                    <p className="font-bold text-lg text-green-600 dark:text-green-400">{sub.grade}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">"{sub.feedback}"</p>
                                </div>
                            ) : (
                                <button onClick={() => { setGradingStudent(sub); setGrade(''); setFeedback(''); }} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Grade</button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
             {gradingStudent && (
                    <form onSubmit={handleGradeSubmit} className="mt-6 p-4 border-t dark:border-gray-600 space-y-3">
                        <h4 className="text-lg font-semibold dark:text-gray-100">Grading: {gradingStudent.studentName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <input type="text" placeholder="Grade (e.g., A+)" value={grade} onChange={e => setGrade(e.target.value)} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                             <textarea placeholder="Feedback" value={feedback} onChange={e => setFeedback(e.target.value)} required className="col-span-2 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" rows={1}></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setGradingStudent(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100">Cancel</button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Submit Grade</button>
                        </div>
                    </form>
                )}
        </div>
    </div>
    )
};
const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100">Cancel</button>
                    <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Confirm</button>
                </div>
            </div>
        </div>
    );
};
const RegisterStudentModal: React.FC<{ isOpen: boolean; onClose: () => void; onRegister: (data: any) => void; courses: Course[] }> = ({ isOpen, onClose, onRegister, courses }) => {
    const [formData, setFormData] = useState({ firstName: '', surname: '', email: '', studentNumber: '', phone: '' });
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCourseSelect = (courseId: string) => {
        setSelectedCourseIds(prev => 
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRegister({...formData, courseIds: selectedCourseIds });
        setFormData({ firstName: '', surname: '', email: '', studentNumber: '', phone: '' });
        setSelectedCourseIds([]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Register New Student</h2>
                <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="text" name="surname" placeholder="Surname" value={formData.surname} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="text" name="studentNumber" placeholder="Student Number" value={formData.studentNumber} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enroll in Courses</h4>
                        <div className="max-h-40 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2">
                            {courses.map(course => (
                                <div key={course.id} className="flex items-center">
                                    <input
                                        id={`course-${course.id}`}
                                        type="checkbox"
                                        checked={selectedCourseIds.includes(course.id)}
                                        onChange={() => handleCourseSelect(course.id)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor={`course-${course.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{course.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Register</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AssignmentsPage: React.FC<{ 
    loggedInUser: User,
    viewAsRole: UserRole,
    assignments: Assignment[], 
    setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>,
    students: User[],
    selectedCourseId: string,
    templates: AssignmentTemplate[],
}> = ({ loggedInUser, viewAsRole, assignments, setAssignments, students, selectedCourseId, templates }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    const handleCreateAssignment = (newAssignmentData: Omit<Assignment, 'id' | 'submissions' | 'courseId'>) => {
        const newAssignment: Assignment = {
            ...newAssignmentData,
            id: `assign${Date.now()}`,
            submissions: [],
            courseId: selectedCourseId,
        };
        setAssignments(prev => [newAssignment, ...prev]);
        setCreateModalOpen(false);
    };
    
    const handleGradeSubmission = (assignmentId: string, studentId: string, grade: string, feedback: string) => {
        setAssignments(prev => prev.map(a => {
            if (a.id === assignmentId) {
                const updatedSubmissions = a.submissions.map(s => 
                    s.studentId === studentId ? { ...s, grade, feedback } : s
                );
                return { ...a, submissions: updatedSubmissions };
            }
            return a;
        }));
        setSelectedAssignment(prev => prev ? {...prev, submissions: prev.submissions.map(s => s.studentId === studentId ? { ...s, grade, feedback } : s) } : null);
    };

    return (
        <div className="p-8">
            <CreateAssignmentModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateAssignment} templates={templates} />
            <AssignmentDetailModal assignment={selectedAssignment} onClose={() => setSelectedAssignment(null)} onGrade={handleGradeSubmission} students={students} />
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Assignments</h2>
                {viewAsRole === UserRole.Teacher && (
                    <button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                        <PlusIcon /> Create Assignment
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.length === 0 && <p className="text-gray-500 dark:text-gray-400 col-span-full">No assignments for this course yet.</p>}
                {assignments.map(assignment => (
                    <div key={assignment.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setSelectedAssignment(assignment)}>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{assignment.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">{assignment.description}</p>
                        <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400">Due: <span className="font-semibold text-red-600 dark:text-red-400">{new Date(assignment.dueDate).toLocaleDateString()}</span></p>
                            <p className="text-gray-500 dark:text-gray-400">Submissions: <span className="font-semibold text-gray-700 dark:text-gray-200">{assignment.submissions.length} / {students.length}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuizzesPage: React.FC<{ viewAsRole: UserRole, quizzes: Quiz[] }> = ({ viewAsRole, quizzes }) => {
    return (
        <div className="p-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Quizzes</h2>
                {viewAsRole === UserRole.Teacher && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                        <PlusIcon /> Create Quiz
                    </button>
                )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.length === 0 && <p className="text-gray-500 dark:text-gray-400 col-span-full">No quizzes for this course yet.</p>}
                {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{quiz.title}</h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4 flex-grow">
                            <p>Starts: {new Date(quiz.startTime).toLocaleString()}</p>
                            <p>Ends: {new Date(quiz.endTime).toLocaleString()}</p>
                            <p>Duration: {quiz.durationMinutes} minutes</p>
                        </div>
                        <button className="mt-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full">
                           {viewAsRole === UserRole.Student ? "Take Quiz" : "View Details"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const StudentsPage: React.FC<{ 
    loggedInUser: User;
    students: User[];
    courses: Course[];
    onRegister: (data: any) => void;
    onViewCredentials: (student: User) => void;
    onUpdateRole: (studentId: string, role: StudentRole) => void;
}> = ({ loggedInUser, students, courses, onRegister, onViewCredentials, onUpdateRole }) => {
    const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
    
    const canRegisterStudents = 
        loggedInUser.role === UserRole.Teacher || 
        loggedInUser.studentRole === StudentRole.Governor || 
        loggedInUser.studentRole === StudentRole.AssistantGovernor;

    if (!canRegisterStudents && loggedInUser.role === UserRole.Student) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Access Denied</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">You do not have permission to view or manage students.</p>
            </div>
        );
    }
    
    return (
        <div className="p-8">
            <RegisterStudentModal isOpen={isRegisterModalOpen} onClose={() => setRegisterModalOpen(false)} onRegister={onRegister} courses={courses} />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Students</h2>
                {canRegisterStudents && (
                    <button onClick={() => setRegisterModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                        <PlusIcon /> Register Student
                    </button>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Student ID</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">No students enrolled in this course.</td>
                            </tr>
                        )}
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className="p-4 flex items-center space-x-3">
                                    <img src={student.profilePictureUrl} alt={student.name} className="h-10 w-10 rounded-full object-cover" />
                                    <span className="font-medium text-gray-800 dark:text-gray-100">{student.name}</span>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{student.studentNumber}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    {loggedInUser.role === UserRole.Teacher ? (
                                        <select 
                                            value={student.studentRole} 
                                            onChange={(e) => onUpdateRole(student.id, e.target.value as StudentRole)}
                                            className="p-1 border rounded-md bg-gray-50 dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value={StudentRole.Regular}>Regular</option>
                                            <option value={StudentRole.AssistantGovernor}>Assistant Governor</option>
                                            <option value={StudentRole.Governor}>Governor</option>
                                        </select>
                                    ) : (
                                        student.studentRole
                                    )}
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{student.email}</td>
                                <td className="p-4">
                                     <div className="flex items-center space-x-2">
                                        {loggedInUser.role === UserRole.Teacher && (
                                            <button onClick={() => onViewCredentials(student)} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" title="View Credentials">
                                                <KeyIcon />
                                            </button>
                                        )}
                                        <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Remove Student">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const VideoUploadsPage: React.FC<{ loggedInUser: User; videos: VideoUpload[]; setVideos: React.Dispatch<React.SetStateAction<VideoUpload[]>> }> = ({ loggedInUser, videos, setVideos }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) return;

        const newVideo: VideoUpload = {
            id: `vid-${Date.now()}`,
            studentId: loggedInUser.id,
            studentName: loggedInUser.name,
            title,
            videoFile: file,
            uploadedAt: new Date(),
        };
        setVideos(prev => [newVideo, ...prev]);
        setTitle('');
        setFile(null);
    };
    
    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Video Uploads</h2>
                <form onSubmit={handleUpload} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Upload a New Video</h3>
                     <input type="text" placeholder="Video Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                     <input type="file" accept="video/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required className="w-full text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Upload</button>
                </form>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.length === 0 && <p className="text-gray-500 dark:text-gray-400 col-span-full">No videos have been uploaded yet.</p>}
                {videos.map(video => (
                    <div key={video.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                           <VideoIcon />
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100">{video.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded by {video.studentName} on {new Date(video.uploadedAt).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CreateTemplateModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onCreate: (data: Omit<AssignmentTemplate, 'id'>) => void; 
}> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ name, title, description });
        setName('');
        setTitle('');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create New Template</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-4 space-y-4">
                    <div>
                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
                        <input type="text" id="template-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Weekly Essay Template" className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="template-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Assignment Title</label>
                        <input type="text" id="template-title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Weekly Essay" className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Description</label>
                        <textarea id="template-description" value={description} onChange={e => setDescription(e.target.value)} required rows={6} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create Template</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TemplatesPage: React.FC<{ 
    templates: AssignmentTemplate[], 
    setTemplates: React.Dispatch<React.SetStateAction<AssignmentTemplate[]>> 
}> = ({ templates, setTemplates }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<AssignmentTemplate | null>(null);

    const handleCreateTemplate = (data: Omit<AssignmentTemplate, 'id'>) => {
        const newTemplate = { ...data, id: `template-${Date.now()}` };
        setTemplates(prev => [newTemplate, ...prev]);
        setCreateModalOpen(false);
    };

    const handleDeleteTemplate = () => {
        if (templateToDelete) {
            setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            setTemplateToDelete(null);
        }
    };

    return (
        <div className="p-8">
            <CreateTemplateModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateTemplate} />
            <ConfirmationModal 
                isOpen={!!templateToDelete}
                onClose={() => setTemplateToDelete(null)}
                onConfirm={handleDeleteTemplate}
                title="Delete Template"
                message={`Are you sure you want to delete the "${templateToDelete?.name}" template? This action cannot be undone.`}
            />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Assignment Templates</h2>
                <button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                    <PlusIcon /> Create Template
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <ul className="space-y-4">
                    {templates.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">You have no saved templates.</p>}
                    {templates.map(template => (
                        <li key={template.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-start">
                            <div className="flex-grow">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{template.name}</h3>
                                <p className="font-semibold text-gray-600 dark:text-gray-300 mt-1">Default Title: "{template.title}"</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 whitespace-pre-wrap">{template.description}</p>
                            </div>
                            <button onClick={() => setTemplateToDelete(template)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-4 flex-shrink-0">
                                <TrashIcon />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ManageCoursesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    onCreate: (name: string, code: string) => void;
    onUpdate: (id: string, name: string, code: string) => void;
    onDeleteRequest: (course: Course) => void;
    currentTeacherId: string;
}> = ({ isOpen, onClose, courses, onCreate, onUpdate, onDeleteRequest, currentTeacherId }) => {
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseCode, setNewCourseCode] = useState('');
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    if (!isOpen) return null;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseName.trim() || !newCourseCode.trim()) return;
        onCreate(newCourseName, newCourseCode);
        setNewCourseName('');
        setNewCourseCode('');
    };

    const handleStartEdit = (course: Course) => {
        setEditingCourse({ ...course });
    };

    const handleCancelEdit = () => {
        setEditingCourse(null);
    };

    const handleUpdate = () => {
        if (editingCourse) {
            onUpdate(editingCourse.id, editingCourse.name, editingCourse.code);
            setEditingCourse(null);
        }
    };

    const teacherCourses = courses.filter(c => c.teacherId === currentTeacherId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Courses</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><CloseIcon /></button>
                </div>
                
                <form onSubmit={handleCreate} className="mb-6 p-4 border dark:border-gray-700 rounded-lg flex items-end space-x-4">
                    <div className="flex-grow">
                        <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Name</label>
                        <input type="text" id="courseName" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div className="flex-grow">
                        <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Code</label>
                        <input type="text" id="courseCode" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center h-10"><PlusIcon className="h-5 w-5 mr-0" /> <span className="ml-2">Add Course</span></button>
                </form>

                <div className="flex-grow overflow-y-auto pr-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Existing Courses</h3>
                    <ul className="space-y-3">
                        {teacherCourses.map(course => (
                            <li key={course.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                                {editingCourse && editingCourse.id === course.id ? (
                                    <>
                                        <input type="text" value={editingCourse.name} onChange={e => setEditingCourse({...editingCourse, name: e.target.value})} className="flex-grow p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                                        <input type="text" value={editingCourse.code} onChange={e => setEditingCourse({...editingCourse, code: e.target.value})} className="w-32 ml-2 p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                                        <div className="flex items-center ml-4">
                                            <button onClick={handleUpdate} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 mr-2">Save</button>
                                            <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600">Cancel</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{course.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleStartEdit(course)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                            <button onClick={() => onDeleteRequest(course)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                         {teacherCourses.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No courses created yet.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const StudentCredentialsModal: React.FC<{ credentials: { name: string, username: string, password: string } | null, onClose: () => void, title?: string }> = ({ credentials, onClose, title = "Student Registered Successfully!" }) => {
    if (!credentials) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Login details for <span className="font-semibold">{credentials.name}</span>.</p>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Username:</span>
                        <span className="ml-2 font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{credentials.username}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Password:</span>
                        <span className="ml-2 font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{credentials.password}</span>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Done</button>
                </div>
            </div>
        </div>
    );
};

const LoginPage: React.FC<{ onLogin: (username: string, password: string) => boolean; }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(username, password);
        if (!success) {
            setError('Invalid username or password.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400">EduSphere</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome Back! Please login to your account.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username-address" className="sr-only">Username</label>
                            <input id="username-address" name="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Username" />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Password" />
                        </div>
                    </div>
                    {error && <p className="text-center text-red-500 text-sm">{error}</p>}
                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function App() {
    // PERSISTENT STATES
    const [allUsers, setAllUsers] = usePersistentState<User[]>(LOCAL_STORAGE_KEYS.USERS, [MOCK_TEACHER, ...MOCK_STUDENTS]);
    const [courses, setCourses] = usePersistentState<Course[]>(LOCAL_STORAGE_KEYS.COURSES, MOCK_COURSES);
    const [assignments, setAssignments] = usePersistentState<Assignment[]>(LOCAL_STORAGE_KEYS.ASSIGNMENTS, MOCK_ASSIGNMENTS, dateReviver);
    const [quizzes, setQuizzes] = usePersistentState<Quiz[]>(LOCAL_STORAGE_KEYS.QUIZZES, MOCK_QUIZZES, dateReviver);
    const [videos, setVideos] = usePersistentState<VideoUpload[]>(LOCAL_STORAGE_KEYS.VIDEOS, MOCK_VIDEOS, dateReviver);
    const [announcements, setAnnouncements] = usePersistentState<Announcement[]>(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS, dateReviver);
    const [assignmentTemplates, setAssignmentTemplates] = usePersistentState<AssignmentTemplate[]>(LOCAL_STORAGE_KEYS.TEMPLATES, MOCK_ASSIGNMENT_TEMPLATES);
    const [theme, setTheme] = usePersistentState<Theme>(LOCAL_STORAGE_KEYS.THEME, 'light');
    
    // SESSION STATES
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [isManageCoursesModalOpen, setManageCoursesModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [newStudentCredentials, setNewStudentCredentials] = useState<{name: string, username: string, password: string} | null>(null);
    const [viewingStudentCreds, setViewingStudentCreds] = useState<User | null>(null);

    // DERIVED STATE from single source of truth (allUsers)
    const allStudents = useMemo(() => allUsers.filter(u => u.role === UserRole.Student), [allUsers]);

    // THEME LOGIC
    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }, [theme, setTheme]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // LOGIN LOGIC
    const handleLogin = (username: string, password: string): boolean => {
        const user = allUsers.find(u => u.username === username && u.password === password);
        if (user) {
            setLoggedInUser(user);
            setIsAuthenticated(true);
            setViewAsRole(user.role);
            return true;
        }
        return false;
    };
    
    const handleLogout = () => {
        setLoggedInUser(null);
        setIsAuthenticated(false);
        setViewAsRole(null);
    };

    // USER MANAGEMENT LOGIC
    const handleRegisterStudent = (newStudentData: Omit<User, 'id'|'role'|'name'|'username'|'password'|'studentRole'>) => {
        const username = `${newStudentData.firstName.toLowerCase()}.${newStudentData.surname.toLowerCase().charAt(0)}`;
        const password = Math.random().toString(36).slice(-8);

        const newStudent: User = {
            ...newStudentData,
            id: `student${Date.now()}`,
            role: UserRole.Student,
            studentRole: StudentRole.Regular,
            name: `${newStudentData.firstName} ${newStudentData.surname}`,
            profilePictureUrl: `https://i.pravatar.cc/150?u=student${Date.now()}`,
            username,
            password,
        };
        setAllUsers(prev => [...prev, newStudent]);
        setNewStudentCredentials({ name: newStudent.name, username, password });
    };

    const handleUpdateStudentRole = (studentId: string, role: StudentRole) => {
        setAllUsers(prev => prev.map(u => u.id === studentId ? { ...u, studentRole: role } : u));
    };

    const handleProfilePictureChange = (file: File) => {
        if (!loggedInUser) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const newProfilePictureUrl = e.target?.result as string;
            setAllUsers(prev => prev.map(u => u.id === loggedInUser.id ? { ...u, profilePictureUrl: newProfilePictureUrl } : u));
            setLoggedInUser(prev => prev ? { ...prev, profilePictureUrl: newProfilePictureUrl } : null);
        };
        reader.readAsDataURL(file);
    };

    // COURSE MANAGEMENT LOGIC
    const handleCourseChange = (courseId: string) => {
        setSelectedCourseId(courseId);
    };

    const handleCreateCourse = (name: string, code: string) => {
        if (!loggedInUser || loggedInUser.role !== UserRole.Teacher) return;

        const trimmedName = name.trim();
        const trimmedCode = code.trim();

        const nameExists = courses.some(course => course.name.toLowerCase() === trimmedName.toLowerCase());
        const codeExists = courses.some(course => course.code.toLowerCase() === trimmedCode.toLowerCase());

        if (nameExists) {
            alert('A course with this name already exists. Please use a different name.');
            return;
        }
        if (codeExists) {
            alert('A course with this code already exists. Please use a different code.');
            return;
        }

        const newCourse: Course = {
            id: `course${Date.now()}`,
            name: trimmedName,
            code: trimmedCode,
            teacherId: loggedInUser.id,
        };
        setCourses(prev => [...prev, newCourse]);
        const updatedUser = { ...loggedInUser, courseIds: [...loggedInUser.courseIds, newCourse.id] };
        setLoggedInUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === loggedInUser.id ? updatedUser : u));
    };

    const handleUpdateCourse = (id: string, name: string, code: string) => {
        const trimmedName = name.trim();
        const trimmedCode = code.trim();

        const nameExists = courses.some(course => course.id !== id && course.name.toLowerCase() === trimmedName.toLowerCase());
        const codeExists = courses.some(course => course.id !== id && course.code.toLowerCase() === trimmedCode.toLowerCase());

        if (nameExists) {
            alert('Another course with this name already exists. Please use a different name.');
            return;
        }
        if (codeExists) {
            alert('Another course with this code already exists. Please use a different code.');
            return;
        }
        
        setCourses(prev => prev.map(c => c.id === id ? { ...c, name: trimmedName, code: trimmedCode } : c));
    };

    const handleDeleteCourse = () => {
        if (!courseToDelete) return;
        // Remove course
        setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
        // Un-enroll all users from this course
        setAllUsers(prev => prev.map(u => ({
            ...u,
            courseIds: u.courseIds.filter(cid => cid !== courseToDelete.id),
        })));
        // Update logged in user if they were enrolled
        if (loggedInUser) {
            const updatedUser = {
                ...loggedInUser,
                courseIds: loggedInUser.courseIds.filter(cid => cid !== courseToDelete.id),
            };
            setLoggedInUser(updatedUser);
            // Also update the user in the main list
            setAllUsers(prev => prev.map(u => u.id === loggedInUser.id ? updatedUser : u));
        }
        setCourseToDelete(null);
    };

    // FILTERED DATA BASED ON SELECTION
    const studentsForSelectedCourse = useMemo(() => {
        if (!selectedCourseId) return [];
        return allStudents.filter(s => s.courseIds.includes(selectedCourseId));
    }, [allStudents, selectedCourseId]);

    const assignmentsForSelectedCourse = useMemo(() => {
        if (!selectedCourseId) return [];
        return assignments.filter(a => a.courseId === selectedCourseId);
    }, [assignments, selectedCourseId]);
    
    const quizzesForSelectedCourse = useMemo(() => {
        if (!selectedCourseId) return [];
        return quizzes.filter(q => q.courseId === selectedCourseId);
    }, [quizzes, selectedCourseId]);

    const announcementsForSelectedCourse = useMemo(() => {
        if (!selectedCourseId) return [];
        return announcements.filter(a => a.courseId === selectedCourseId);
    }, [announcements, selectedCourseId]);
    
    if (!isAuthenticated || !loggedInUser || !viewAsRole) {
        return (
             <ThemeContext.Provider value={{ theme, toggleTheme }}>
                <div className={`${theme}`}>
                    <LoginPage onLogin={handleLogin} />
                </div>
            </ThemeContext.Provider>
        );
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`flex min-h-screen font-sans ${theme}`}>
                 <StudentCredentialsModal credentials={newStudentCredentials} onClose={() => setNewStudentCredentials(null)} />
                 <StudentCredentialsModal credentials={viewingStudentCreds ? {name: viewingStudentCreds.name, username: viewingStudentCreds.username, password: viewingStudentCreds.password} : null} onClose={() => setViewingStudentCreds(null)} title="Student Credentials"/>
                <ConfirmationModal 
                    isOpen={!!courseToDelete}
                    onClose={() => setCourseToDelete(null)}
                    onConfirm={handleDeleteCourse}
                    title="Delete Course"
                    message={`Are you sure you want to delete the course "${courseToDelete?.name}"? All associated data will be lost.`}
                />
                 <ManageCoursesModal
                    isOpen={isManageCoursesModalOpen}
                    onClose={() => setManageCoursesModalOpen(false)}
                    courses={courses}
                    onCreate={handleCreateCourse}
                    onUpdate={handleUpdateCourse}
                    onDeleteRequest={setCourseToDelete}
                    currentTeacherId={loggedInUser.role === UserRole.Teacher ? loggedInUser.id : ''}
                />

                <Sidebar viewAsRole={viewAsRole} />
                <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
                    <Header
                        loggedInUser={loggedInUser}
                        onLogout={handleLogout}
                        onProfilePictureChange={handleProfilePictureChange}
                        viewAsRole={viewAsRole}
                        setViewAsRole={setViewAsRole}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                        onCourseChange={handleCourseChange}
                        onManageCourses={() => setManageCoursesModalOpen(true)}
                    />
                    <main className="flex-1 overflow-y-auto">
                        {selectedCourseId ? (
                             <Routes>
                                <Route path="/" element={<Dashboard loggedInUser={loggedInUser} viewAsRole={viewAsRole} assignments={assignmentsForSelectedCourse} quizzes={quizzesForSelectedCourse} students={studentsForSelectedCourse} announcements={announcementsForSelectedCourse} setAnnouncements={setAnnouncements} selectedCourseId={selectedCourseId} />} />
                                <Route path="/assignments" element={<AssignmentsPage loggedInUser={loggedInUser} viewAsRole={viewAsRole} assignments={assignmentsForSelectedCourse} setAssignments={setAssignments} students={studentsForSelectedCourse} selectedCourseId={selectedCourseId} templates={assignmentTemplates}/>} />
                                <Route path="/quizzes" element={<QuizzesPage viewAsRole={viewAsRole} quizzes={quizzesForSelectedCourse}/>} />
                                <Route path="/calendar" element={<CalendarPage assignments={assignments} quizzes={quizzes} />} />
                                {loggedInUser.role === UserRole.Teacher && <Route path="/templates" element={<TemplatesPage templates={assignmentTemplates} setTemplates={setAssignmentTemplates} />} />}
                                <Route path="/students" element={<StudentsPage loggedInUser={loggedInUser} students={studentsForSelectedCourse} courses={courses} onRegister={handleRegisterStudent} onViewCredentials={setViewingStudentCreds} onUpdateRole={handleUpdateStudentRole} />} />
                                {viewAsRole === UserRole.Student && <Route path="/videos" element={<VideoUploadsPage loggedInUser={loggedInUser} videos={videos} setVideos={setVideos} />} />}
                            </Routes>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center p-8">
                                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Welcome to EduSphere!</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">Please select a course from the dropdown above to get started.</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </ThemeContext.Provider>
    );
}