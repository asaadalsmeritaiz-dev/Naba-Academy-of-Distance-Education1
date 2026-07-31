import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  Award,
  Filter,
  Search,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { mockStudents, mockAlerts } from '../data/mock';

export default function StudentAnalytics() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filter students based on search
  const filteredStudents = mockStudents.filter(student => 
    student.name.includes(searchQuery) || 
    student.studentId.includes(searchQuery) ||
    student.major.includes(searchQuery)
  );

  // Filter proctor alerts based on severity
  const filteredAlerts = mockAlerts.filter(alert => 
    severityFilter === 'all' ? true : alert.severity === severityFilter
  );

  // Calculate statistics
  const avgGpa = mockStudents.length > 0
    ? (mockStudents.reduce((acc, curr) => acc + curr.gpa, 0) / mockStudents.length).toFixed(2)
    : '0.00';

  const avgProgress = mockStudents.length > 0
    ? Math.round(mockStudents.reduce((acc, curr) => acc + curr.progress, 0) / mockStudents.length)
    : 0;

  const totalViolations = mockAlerts.length;
  const highSeverityViolations = mockAlerts.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="student-analytics-view">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800">تحليلات سلوكيات وتقييم الطلاب</h2>
        <p className="text-xs text-slate-500 font-medium">متابعة تقدم الطلاب الدراسي ومراقبة مخالفات الامتحانات وسير العملية التعليمية.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">إجمالي الطلاب المسجلين</span>
            <p className="text-2xl font-black text-slate-800">{mockStudents.length}</p>
            <span className="text-[10px] text-slate-400 font-bold block">في كافة مساقاتك الحالية</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Avg Progress Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">متوسط التقدم الدراسي</span>
            <p className="text-2xl font-black text-slate-800">{avgProgress}%</p>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-slate-900 h-full" style={{ width: `${avgProgress}%` }}></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Avg GPA Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">متوسط درجات الطلاب (GPA)</span>
            <p className="text-2xl font-black text-slate-800">{avgGpa} <span className="text-xs text-slate-450">/ 4.0</span></p>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full block w-max">مستوى عام ممتاز</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Violations Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">المخالفات المرصودة</span>
            <p className="text-2xl font-black text-red-600">{totalViolations}</p>
            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2.5 py-0.5 rounded-full block w-max">
              {highSeverityViolations} مخالفة عالية الخطورة
            </span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Students Progress Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-slate-400" />
                قائمة الطلاب ومستويات التقدم الدراسي
              </h3>
              
              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن طالب، رقم أكاديمي..."
                  className="w-full border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-slate-800 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">الرقم الأكاديمي</th>
                    <th className="p-4">التخصص</th>
                    <th className="p-4">التقدم في المقرر</th>
                    <th className="p-4">المعدل GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                        لم يتم العثور على نتائج تطابق البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-extrabold text-slate-900">{student.name}</td>
                        <td className="p-4 font-mono text-slate-500">{student.studentId}</td>
                        <td className="p-4 text-slate-650">{student.major}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800">{student.progress}%</span>
                            <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden hidden sm:block">
                              <div className="bg-slate-900 h-full" style={{ width: `${student.progress}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-black">
                            {student.gpa.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Proctoring Violation Alerts Log */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-50 space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                سجل إنذارات ومخالفات الامتحانات
              </h3>

              {/* Severity Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all ${
                      severityFilter === sev
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev === 'all' && 'الكل'}
                    {sev === 'high' && 'عالية'}
                    {sev === 'medium' && 'متوسطة'}
                    {sev === 'low' && 'منخفضة'}
                  </button>
                ))}
              </div>
            </div>

            {/* Violation Alert Log List */}
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold space-y-2">
                  <AlertTriangle className="h-6 w-6 text-slate-300 mx-auto" />
                  <p className="text-[10px] text-slate-400">لا توجد بلاغات مخالفة مرصودة حالياً.</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      alert.severity === 'high'
                        ? 'bg-red-50/40 border-red-100'
                        : alert.severity === 'medium'
                          ? 'bg-amber-50/40 border-amber-100'
                          : 'bg-slate-50 border-slate-100'
                    } flex items-start gap-3`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-600'
                        : alert.severity === 'medium'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-900">{alert.studentName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        {alert.message}
                      </p>
                      <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                      }`}>
                        {alert.severity === 'high' && 'خطورة عالية'}
                        {alert.severity === 'medium' && 'خطورة متوسطة'}
                        {alert.severity === 'low' && 'خطورة منخفضة'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
