import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const en = {
  app: 'TaskFlow',
  nav: {
    dashboard: 'Dashboard', inbox: 'Inbox', today: 'Today', upcoming: 'Upcoming',
    projects: 'Projects', calendar: 'Calendar', focus: 'Focus Mode', stats: 'Statistics',
    archive: 'Archive', trash: 'Recycle bin', settings: 'Settings',
  },
  auth: {
    signIn: 'Sign in', signUp: 'Create account', email: 'Email', password: 'Password',
    google: 'Continue with Google', reset: 'Forgot password?', resetSent: 'Password reset email sent.',
    noAccount: "Don't have an account?", haveAccount: 'Already have an account?', signOut: 'Sign out',
    or: 'or', invalidCredentials: 'Invalid email or password.',
    authError: 'Authentication failed. Please try again.',
  },
  settings: {
    language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark', system: 'System',
    dataTitle: 'Data Management', exportJSON: 'Export JSON (Backup)', exportCSV: 'Export CSV (Spreadsheet)',
    importData: 'Import File (JSON or CSV)', importSuccess: 'Successfully imported {{count}} items!',
    importError: 'Failed to import file. Please check format.',
  },
  common: { loading: 'Loading…', comingSoon: 'Coming soon', add: 'Add task' },
  task: {
    title: 'Title', description: 'Description', due: 'Due date', priority: 'Priority', project: 'Project',
    none: 'None', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit task', new: 'New task',
    quickPlaceholder: 'Quick add: "Send report tomorrow 09:00 #work p1"', preview: 'Detected',
    p0: 'None', p1: 'Low', p2: 'Medium', p3: 'High', p4: 'Urgent', subtasks: 'Subtasks',
    addSubtask: 'Add subtask', overdue: 'Overdue', empty: 'No tasks here yet.', restore: 'Restore',
    deleteForever: 'Delete permanently', done: 'Done', greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon', greetingEvening: 'Good evening', left: 'left',
    tasksCount: '{{count}} tasks', completed: 'completed', activeProjects: 'Active projects',
  },
  project: {
    new: 'New project', name: 'Project name', color: 'Color', icon: 'Icon',
    empty: 'No projects yet. Create your first project to get organized!',
    all: 'All projects', viewList: 'List', viewKanban: 'Kanban', viewCalendar: 'Calendar',
    deleteConfirm: 'Are you sure you want to delete this project?',
  },
  kanban: {
    todo: 'To Do', doing: 'In Progress', waiting: 'Waiting', done: 'Done',
    emptyCol: 'Drop tasks here',
  },
  calendar: {
    today: 'Today', prev: 'Previous month', next: 'Next month',
  },
  stats: {
    overview: 'Overview', totalTasks: 'Total tasks', completedTasks: 'Completed',
    completionRate: 'Completion rate', overdueTasks: 'Overdue',
    weeklyTrend: 'Productivity (Last 7 Days)', tasksCompleted: 'Tasks completed',
    projectBreakdown: 'Project Breakdown', noData: 'No tasks completed yet in this period.',
  },
  search: {
    placeholder: 'Search tasks... (/ to focus)', filters: 'Filters', clear: 'Clear filters',
    all: 'All', noResults: 'No tasks found matching your search.',
  },
  focus: {
    pomodoro: 'Pomodoro', shortBreak: 'Short Break', longBreak: 'Long Break',
    start: 'Start', pause: 'Pause', reset: 'Reset', skip: 'Skip',
    selectTask: 'Select a task to focus on', noTaskSelected: 'No task selected',
    completedSessions: 'Sessions completed', soundEnabled: 'Sound alarm',
  },
}

const id: typeof en = {
  app: 'TaskFlow',
  nav: {
    dashboard: 'Dashboard', inbox: 'Inbox', today: 'Hari Ini', upcoming: 'Mendatang',
    projects: 'Proyek', calendar: 'Kalender', focus: 'Mode Fokus', stats: 'Statistik',
    archive: 'Arsip', trash: 'Tempat sampah', settings: 'Pengaturan',
  },
  auth: {
    signIn: 'Masuk', signUp: 'Buat akun', email: 'Email', password: 'Kata sandi',
    google: 'Lanjutkan dengan Google', reset: 'Lupa kata sandi?', resetSent: 'Email reset kata sandi terkirim.',
    noAccount: 'Belum punya akun?', haveAccount: 'Sudah punya akun?', signOut: 'Keluar',
    or: 'atau', invalidCredentials: 'Email atau kata sandi tidak valid.',
    authError: 'Autentikasi gagal. Silakan coba lagi.',
  },
  settings: {
    language: 'Bahasa', theme: 'Tema', light: 'Terang', dark: 'Gelap', system: 'Sistem',
    dataTitle: 'Manajemen Data', exportJSON: 'Ekspor JSON (Cadangan)', exportCSV: 'Ekspor CSV (Spreadsheet)',
    importData: 'Impor File (JSON atau CSV)', importSuccess: 'Berhasil mengimpor {{count}} data!',
    importError: 'Gagal mengimpor file. Periksa format file.',
  },
  common: { loading: 'Memuat…', comingSoon: 'Segera hadir', add: 'Tambah tugas' },
  task: {
    title: 'Judul', description: 'Deskripsi', due: 'Tenggat', priority: 'Prioritas', project: 'Proyek',
    none: 'Tidak ada', save: 'Simpan', cancel: 'Batal', delete: 'Hapus', edit: 'Ubah tugas', new: 'Tugas baru',
    quickPlaceholder: 'Tambah cepat: "Kirim laporan besok 09:00 #kerja p1"', preview: 'Terdeteksi',
    p0: 'Tidak ada', p1: 'Rendah', p2: 'Sedang', p3: 'Tinggi', p4: 'Mendesak', subtasks: 'Subtugas',
    addSubtask: 'Tambah subtugas', overdue: 'Terlambat', empty: 'Belum ada tugas.', restore: 'Pulihkan',
    deleteForever: 'Hapus permanen', done: 'Selesai', greetingMorning: 'Selamat pagi',
    greetingAfternoon: 'Selamat siang', greetingEvening: 'Selamat malam', left: 'tersisa',
    tasksCount: '{{count}} tugas', completed: 'selesai', activeProjects: 'Proyek aktif',
  },
  project: {
    new: 'Proyek baru', name: 'Nama proyek', color: 'Warna', icon: 'Ikon',
    empty: 'Belum ada proyek. Buat proyek pertamamu untuk mulai mengorganisir tugas!',
    all: 'Semua proyek', viewList: 'Daftar', viewKanban: 'Kanban', viewCalendar: 'Kalender',
    deleteConfirm: 'Apakah Anda yakin ingin menghapus proyek ini?',
  },
  kanban: {
    todo: 'Belum Mulai', doing: 'Sedang Dikerjakan', waiting: 'Menunggu', done: 'Selesai',
    emptyCol: 'Tarik tugas ke sini',
  },
  calendar: {
    today: 'Hari Ini', prev: 'Bulan lalu', next: 'Bulan depan',
  },
  stats: {
    overview: 'Ringkasan', totalTasks: 'Total tugas', completedTasks: 'Selesai',
    completionRate: 'Rasio penyelesaian', overdueTasks: 'Terlambat',
    weeklyTrend: 'Produktivitas (7 Hari Terakhir)', tasksCompleted: 'Tugas selesai',
    projectBreakdown: 'Rincian Proyek', noData: 'Belum ada tugas selesai pada periode ini.',
  },
  search: {
    placeholder: 'Cari tugas... (tekan / untuk fokus)', filters: 'Filter', clear: 'Reset filter',
    all: 'Semua', noResults: 'Tidak ada tugas yang sesuai pencarian.',
  },
  focus: {
    pomodoro: 'Fokus', shortBreak: 'Istirahat Pendek', longBreak: 'Istirahat Panjang',
    start: 'Mulai', pause: 'Jeda', reset: 'Reset', skip: 'Lewati',
    selectTask: 'Pilih tugas untuk fokus', noTaskSelected: 'Belum ada tugas dipilih',
    completedSessions: 'Sesi selesai', soundEnabled: 'Bunyikan alarm',
  },
}

const zh: typeof en = {
  app: 'TaskFlow',
  nav: {
    dashboard: '仪表盘', inbox: '收件箱', today: '今天', upcoming: '即将到来',
    projects: '项目', calendar: '日历', focus: '专注模式', stats: '统计',
    archive: '归档', trash: '回收站', settings: '设置',
  },
  auth: {
    signIn: '登录', signUp: '创建账户', email: '邮箱', password: '密码',
    google: '使用 Google 继续', reset: '忘记密码？', resetSent: '密码重置邮件已发送。',
    noAccount: '还没有账户？', haveAccount: '已有账户？', signOut: '退出登录',
    or: '或', invalidCredentials: '邮箱或密码不正确。',
    authError: '认证失败，请重试。',
  },
  settings: {
    language: '语言', theme: '主题', light: '浅色', dark: '深色', system: '跟随系统',
    dataTitle: '数据管理', exportJSON: '导出 JSON（备份）', exportCSV: '导出 CSV（电子表格）',
    importData: '导入文件 (JSON 或 CSV)', importSuccess: '成功导入 {{count}} 项数据！',
    importError: '导入文件失败，请检查格式。',
  },
  common: { loading: '加载中…', comingSoon: '即将推出', add: '添加任务' },
  task: {
    title: '标题', description: '描述', due: '截止日期', priority: '优先级', project: '项目',
    none: '无', save: '保存', cancel: '取消', delete: '删除', edit: '编辑任务', new: '新任务',
    quickPlaceholder: '快速添加："明天 09:00 发送报告 #工作 p1"', preview: '已识别',
    p0: '无', p1: '低', p2: '中', p3: '高', p4: '紧急', subtasks: '子任务',
    addSubtask: '添加子任务', overdue: '已逾期', empty: '这里还没有任务。', restore: '恢复',
    deleteForever: '永久删除', done: '已完成', greetingMorning: '早上好',
    greetingAfternoon: '下午好', greetingEvening: '晚上好', left: '剩余',
    tasksCount: '{{count}} 个任务', completed: '已完成', activeProjects: '进行中的项目',
  },
  project: {
    new: '新建项目', name: '项目名称', color: '颜色', icon: '图标',
    empty: '还没有项目。创建您的第一个项目以开始整理任务！',
    all: '所有项目', viewList: '列表', viewKanban: '看板', viewCalendar: '日历',
    deleteConfirm: '您确定要删除此项目吗？',
  },
  kanban: {
    todo: '待办', doing: '进行中', waiting: '等待中', done: '已完成',
    emptyCol: '将任务拖动到此处',
  },
  calendar: {
    today: '今天', prev: '上个月', next: '下个月',
  },
  stats: {
    overview: '概览', totalTasks: '任务总数', completedTasks: '已完成',
    completionRate: '完成率', overdueTasks: '已逾期',
    weeklyTrend: '生产力（过去 7 天）', tasksCompleted: '完成的任务数',
    projectBreakdown: '项目明细', noData: '在此期间尚未完成任何任务。',
  },
  search: {
    placeholder: '搜索任务... (按 / 聚焦)', filters: '筛选', clear: '重置筛选',
    all: '全部', noResults: '未找到符合条件的任务。',
  },
  focus: {
    pomodoro: '专注', shortBreak: '短休息', longBreak: '长休息',
    start: '开始', pause: '暂停', reset: '重置', skip: '跳过',
    selectTask: '选择要专注的任务', noTaskSelected: '未选择任务',
    completedSessions: '已完成专注次数', soundEnabled: '开启提示音',
  },
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'zh', label: '中文' },
] as const

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, id: { translation: id }, zh: { translation: zh } },
  lng: localStorage.getItem('lang') ?? 'en', // English is the default
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
i18n.on('languageChanged', l => { localStorage.setItem('lang', l); document.documentElement.lang = l })

export default i18n
