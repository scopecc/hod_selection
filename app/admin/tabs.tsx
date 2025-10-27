'use client';
import useSWR from 'swr';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Search, Plus, Edit3, Trash2, Users, FileText, Upload, BarChart3, LogOut, Check, X, AlertCircle } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import ReactDOM from 'react-dom';
import React from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const glassEffect = "backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl shadow-black/5";
const cardStyles = "bg-white/60 backdrop-blur-lg border border-gray-100/50 shadow-xl shadow-black/[0.02] rounded-2xl";
const inputStyles = "bg-white/70 border-0 rounded-xl shadow-inner shadow-black/5 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300";
const buttonBase = "rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none";

const buttonVariants = {
  primary: `${buttonBase} bg-gradient-to-r from-blue-600 to-blue-700 text-black shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 px-6 py-3`,
  outline: `${buttonBase} border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md px-6 py-3`,
  destructive: `${buttonBase} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 px-5 py-2.5`,
  ghost: `${buttonBase} text-gray-600 hover:bg-gray-100/80 hover:text-gray-800 px-4 py-2`,
  small: `${buttonBase} text-sm px-4 py-2`,
  icon: `${buttonBase} p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80`,
};
const dropdownWrapperClass = "relative overflow-visible z-[9999]";
const dropdownOptionsClass = `
  fixed left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl max-h-64 overflow-auto 
  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[20000]
`;

const StatusIndicator = ({ status }: { status: 'open' | 'closed' }) => (
  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
    status === 'open' 
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
      : 'bg-gray-100 text-gray-600 border border-gray-200'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
      status === 'open' ? 'bg-emerald-500' : 'bg-gray-400'
    }`} />
    {status}
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-sm">{description}</p>
  </div>
);

function UsersTab() {
  const { data, mutate } = useSWR('/api/admin/users', fetcher);
  // Extract unique programme values from programmeOptions and add Other
  const programmeOptions = [
    { degree: 'BTech', programme: 'BTech CSE', representation: 'BTech BCE' },
    { degree: 'BTech', programme: 'BTech AIML', representation: 'BTech BAI' },
    { degree: 'BTech', programme: 'BTech AIR', representation: 'BTech BRS' },
    { degree: 'BTech', programme: 'BTech Cyber Security', representation: 'BTech BYB' },
    { degree: 'BTech', programme: 'BTech Data Science', representation: 'BTech BDS' },
    { degree: 'BTech', programme: 'BTech CPS', representation: 'BTech BPS' },
    { degree: 'MTech (Int)', programme: 'MTech Business Analytics (2021–2024) / Data Science (2025)', representation: 'MTech MIA / MID' },
    { degree: 'MTech (Int)', programme: 'MTech SE', representation: 'MTech MIS' },
    { degree: 'MTech', programme: 'MTech CSE', representation: 'MTech MCS' },
    { degree: 'MTech', programme: 'MTech AIML', representation: 'MTech MAI' },
    { degree: 'MTech LTI', programme: 'MTech AIML', representation: 'MTech MML' },
    { degree: 'MTech LTI', programme: 'MTech AIDS', representation: 'MTech MAS' },
    { degree: 'MCA', programme: '—', representation: 'MCA' },
    { degree: 'BSC', programme: '—', representation: 'BCS' }
  ];
  const departmentOptions = Array.from(new Set(programmeOptions.map(opt => opt.programme).filter(p => p !== '—'))).concat(['Other']);
  const [form, setForm] = useState({ name: '', employeeId: '', email: '', department: '', programme: 'SCOPE' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [programmeSearch, setProgrammeSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown positioning state and refs
  const departmentBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [departmentDropdownPos, setDepartmentDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [departmentOpen, setDepartmentOpen] = useState(false);

  // Calculate dropdown position on open
  useEffect(() => {
    if (departmentOpen && departmentBtnRef.current) {
      const rect = departmentBtnRef.current.getBoundingClientRect();
      setDepartmentDropdownPos({ left: rect.left, top: rect.bottom + window.scrollY, width: rect.width });
    } else {
      setDepartmentDropdownPos(null);
    }
  }, [departmentOpen]);

  const filteredDepartmentOptions = departmentOptions.filter(opt =>
    opt.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const filteredUsers = data?.users?.filter((user: any) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toTitleCase = (str: string): string => str ? str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';
    const payload = {
      ...form,
      name: toTitleCase(form.name),
      employeeId: toTitleCase(form.employeeId),
      email: form.email.trim(),
      department: form.department.trim().toUpperCase(),
      programme: form.programme || '',
    };
    
    try {
      if (isEditing) {
        await fetch('/api/admin/users', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setForm({ name: '', employeeId: '', email: '', department: '', programme: 'SCOPE' });
      setEditingUser(null);
      setIsEditing(false);
      mutate();
    } catch (error) {
      console.error('Error submitting user:', error);
    }
  };

  const editUser = (user: any) => {
    setForm({
      name: user.name,
      employeeId: user.employeeId,
      email: user.email,
      department: user.department,
      programme: user.programme || ''
    });
    setEditingUser(user);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm({ name: '', employeeId: '', email: '', department: '', programme: 'SCOPE' });
    setEditingUser(null);
    setIsEditing(false);
  };

  const remove = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`/api/admin/users?employeeId=${encodeURIComponent(employeeId)}`, { method: 'DELETE' });
      mutate();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add/Edit User Card */}
  <div className={cardStyles.replace('overflow-hidden', '') + ' z-[30000]'}>
        <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              {isEditing ? <Edit3 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{isEditing ? 'Update User' : 'Add New User'}</h2>
              <p className="text-sm text-gray-600">{isEditing ? 'Modify user information' : 'Create a new user account'}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
                aria-label="User Name"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">Employee ID</label>
              <input
                placeholder="Employee ID"
                value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                required
                disabled={isEditing}
                className={`w-full h-12 px-4 text-base font-mono ${inputStyles} placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500`}
                aria-label="Employee ID"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                placeholder="user@example.com"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
                aria-label="Email Address"
              />
            </div>
            
            {/* Enhanced Department Selection */}
<div className="space-y-2 flex flex-col md:flex-row md:items-start md:space-x-4 md:space-y-0 md:col-span-3">
  <div className={`${dropdownWrapperClass} overflow-visible flex-1`}>
    <label className="text-sm font-medium dark:text-gray-300 text-gray-700">
      Department
    </label>
    <Listbox
      value={form.department}
      onChange={val => setForm({ ...form, department: val })}
    >
      {({ open }) => {
        useEffect(() => { setDepartmentOpen(open); }, [open]);
        return (
          <div className="relative w-full overflow-visible">
            <Listbox.Button
              ref={departmentBtnRef}
              className={`w-full h-12 flex items-center justify-between px-4 text-base dark:text-gray-200 text-gray-700 ${inputStyles}`}
            >
              <span className="truncate">
                {form.department === 'Other' ? 'Other' : (form.department || 'Select Department')}
              </span>
              <svg
                className="w-4 h-4 ml-2 dark:text-gray-400 text-gray-400 transition-transform ui-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Listbox.Button>
            {open && departmentDropdownPos && ReactDOM.createPortal(
              <Listbox.Options className={`${dropdownOptionsClass} absolute z-[99999]`} style={{ left: departmentDropdownPos.left, top: departmentDropdownPos.top, width: departmentDropdownPos.width, position: 'absolute' }}>
                <div className="sticky top-0 p-3 border-b border-gray-100/50 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border-0 focus:bg-white dark:focus:bg-gray-700 transition-colors"
                      placeholder="Search departments..."
                      value={departmentSearch}
                      onChange={e => setDepartmentSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  {filteredDepartmentOptions.length ? (
                    <>
                      {filteredDepartmentOptions.map((opt, idx) => (
                        <Listbox.Option
                          key={idx}
                          value={opt}
                          className={({ active, selected }) =>
                            `cursor-pointer px-4 py-3 text-base transition-colors ${
                              active
                                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'text-gray-800 dark:text-gray-200'
                            } ${
                              selected
                                ? 'font-semibold bg-blue-100 dark:bg-blue-800'
                                : 'font-normal'
                            }`
                          }
                        >
                          <div className="truncate max-w-full">{opt}</div>
                        </Listbox.Option>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No departments found
                    </div>
                  )}
                </div>
              </Listbox.Options>,
              document.body
            )}
          </div>
        );
      }}
    </Listbox>
  </div>

  {/* Custom Department Input: show when 'Other' is selected OR when current value isn't in the options (editing a saved custom value) */}
  {(form.department === 'Other' || (form.department && !departmentOptions.includes(form.department))) && (
    <div className="flex-1">
      <label className="text-sm font-medium dark:text-gray-300 text-gray-700">
        Custom Department
      </label>
      <input
        type="text"
        placeholder="Enter custom department..."
        value={form.department === 'Other' ? '' : form.department}
        onChange={e => setForm({ ...form, department: e.target.value })}
        className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
        autoFocus
      />
    </div>
  )}
</div>



            <div className="md:col-span-5 space-y-2">
              <label className="text-sm font-medium dark:text-gray-300 text-gray-700">Programme</label>
              <input
                type="text"
                placeholder="Enter programme..."
                value={form.programme}
                onChange={e => setForm({ ...form, programme: e.target.value })}
                className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
              />
            </div>


            <div className="md:col-span-5 flex gap-3 justify-start pt-4">
              <button type="submit" className={buttonVariants.primary}>
                <div className="flex items-center space-x-2">
                  {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isEditing ? 'Update User' : 'Create User'}</span>
                </div>
              </button>
              {isEditing && (
                <button type="button" className={buttonVariants.outline} onClick={cancelEdit}>
                  <div className="flex items-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </div>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Users List Card */}
  <div className={cardStyles}>
        <div className="p-6 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600">{data?.users?.length || 0} users total</p>
              </div>
            </div>
            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 text-sm ${inputStyles}`}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {!data ? (
            <LoadingSpinner />
          ) : filteredUsers.length === 0 ? (
            searchQuery ? (
              <EmptyState 
                icon={Search} 
                title="No users found" 
                description={`No users match "${searchQuery}". Try a different search term.`} 
              />
            ) : (
              <EmptyState 
                icon={Users} 
                title="No users yet" 
                description="Create your first user account to get started." 
              />
            )
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Programme</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredUsers.map((user: any) => (
                  <tr key={user.employeeId} className="hover:bg-blue-50/30 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="text-base font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{user.employeeId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {user.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{user.programme || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => editUser(user)}
                          className={buttonVariants.icon}
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(user.employeeId)}
                          className={`${buttonVariants.icon} text-red-500 hover:text-red-700 hover:bg-red-50`}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DraftsTab() {
  const { data, mutate } = useSWR('/api/admin/drafts', fetcher);
  const [form, setForm] = useState({ name: '', yearStart: '', yearEnd: '', programme: 'SCOPE' });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrafts = data?.drafts?.filter((draft: any) =>
    draft.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), yearStart: Number(form.yearStart), yearEnd: Number(form.yearEnd) }),
      });
      if (res.status === 409) {
        alert('A draft with this name already exists. Please choose a different name.');
        return;
      }
      if (!res.ok) {
        alert('Failed to create draft.');
        return;
      }
      setForm({ name: '', yearStart: '', yearEnd: '', programme: 'SCOPE' });
      mutate();
    } catch (error) {
      console.error('Error creating draft:', error);
    }
  };

  const setStatus = async (id: string, status: 'open' | 'closed') => {
    try {
      await fetch('/api/admin/drafts', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
      mutate();
    } catch (error) {
      console.error('Error updating draft status:', error);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await fetch(`/api/admin/drafts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      mutate();
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Draft Card */}
      <div className={`${cardStyles} overflow-hidden`}>
        <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Draft</h2>
              <p className="text-sm text-gray-600">Set up a new academic draft period</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Draft Name</label>
              <input
                placeholder="e.g., Fall 2025 Registration"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Year</label>
              <input
                type="number"
                placeholder="2025"
                value={form.yearStart}
                onChange={e => setForm({ ...form, yearStart: e.target.value })}
                min={2020}
                required
                className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Year</label>
              <input
                type="number"
                placeholder="2026"
                value={form.yearEnd}
                onChange={e => setForm({ ...form, yearEnd: e.target.value })}
                min={2020}
                required
                className={`w-full h-12 px-4 text-base ${inputStyles} placeholder:text-gray-400`}
              />
            </div>
            <div className="md:col-span-4 pt-2">
              <button type="submit" className={buttonVariants.primary}>
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Draft</span>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Draft Search and List */}
      <div className={`${cardStyles} overflow-hidden`}>
        <div className="p-6 border-b border-gray-100/50 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Draft Management</h2>
              <p className="text-sm text-gray-600">{filteredDrafts.length} drafts</p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 h-10 text-sm rounded-xl ${inputStyles}`}
              aria-label="Search Drafts"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {!data ? (
            <LoadingSpinner />
          ) : filteredDrafts.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              title="No drafts found" 
              description="No drafts match your search query." 
            />
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Draft Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Academic Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredDrafts.map((draft: any) => (
                  <tr key={draft._id} className="hover:bg-gray-50/30 transition-colors duration-200">
                    <td className="px-6 py-4 text-base font-medium text-gray-900">{draft.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(draft.yearStart).getFullYear()} - {new Date(draft.yearEnd).getFullYear()}</td>
                    <td className="px-6 py-4"><StatusIndicator status={draft.status} /></td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                      <button
                        onClick={() => setStatus(draft._id, draft.status === 'open' ? 'closed' : 'open')}
                        className={`${buttonVariants.small} ${draft.status === 'open' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        title={draft.status === 'open' ? 'Close Draft' : 'Reopen Draft'}
                      >
                        {draft.status === 'open' ? 'Close' : 'Reopen'}
                      </button>
                      <button
                        onClick={() => remove(draft._id)}
                        className={`${buttonVariants.icon} text-red-500 hover:text-red-700 hover:bg-red-50`}
                        title="Delete Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadTab() {
  const { data: drafts } = useSWR('/api/admin/drafts', fetcher);
  const [selectedDraft, setSelectedDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async () => {
    if (!selectedDraft || !file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // The backend should parse L, T, P, J columns and save them in DB for each course entry
      // No calculation needed, just upload and backend will handle storing L, T, P, J
      await fetch(`/api/admin/courses?draftId=${encodeURIComponent(selectedDraft)}`, { method: 'POST', body: formData });
      alert('File uploaded successfully!');
      setFile(null);
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clear = async () => {
    if (!selectedDraft) return;
    try {
      await fetch(`/api/admin/courses?draftId=${encodeURIComponent(selectedDraft)}`, { method: 'DELETE' });
      alert('Courses cleared successfully!');
    } catch (error) {
      alert('Clear failed. Please try again.');
    }
  };

  return (
    <div className="flex justify-center">
      <div className={`${cardStyles} w-full max-w-lg`}>
        <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Course Upload</h2>
              <p className="text-sm text-gray-600">Upload course data via CSV file</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Draft</label>
            <select
              className={`w-full h-12 px-4 text-base ${inputStyles}`}
              value={selectedDraft}
              onChange={e => setSelectedDraft(e.target.value)}
            >
              <option value="">Choose a draft...</option>
              {drafts?.drafts?.map((draft: any) => (
                <option key={draft._id} value={draft._id}>
                  {draft.name} ({new Date(draft.yearStart).getFullYear()}-{new Date(draft.yearEnd).getFullYear()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course Data File</label>
            <div className={`relative border-2 border-dashed rounded-xl p-8 text-center hover:border-gray-300 transition-colors ${file ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
              <input
                type="file"
                accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload courses CSV file"
              />
              <div className="space-y-2">
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${file ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Upload className={`w-6 h-6 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-green-800">{file.name}</p>
                    <p className="text-xs text-green-600">Ready to upload</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Drop your CSV file here</p>
                    <p className="text-xs text-gray-500">or click to browse</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 justify-center">
            <button 
              type="button" 
              onClick={upload} 
              disabled={!selectedDraft || !file || isUploading}
              className={`${buttonVariants.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Upload CSV"
            >
              <div className="flex items-center space-x-2">
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Courses'}</span>
              </div>
            </button>
            <button 
              type="button" 
              onClick={clear} 
              disabled={!selectedDraft}
              className={`${buttonVariants.outline} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Clear Uploaded Courses"
            >
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </div>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Upload Requirements</p>
                <ul className="text-blue-700 space-y-1 text-xs list-disc list-inside">
                  <li>File must be in CSV format</li>
                  <li>Ensure all required columns are present</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Select an active draft before uploading</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function RegistrationsTab() {
  const { data: drafts } = useSWR('/api/admin/drafts', fetcher);
  const [selectedDraft, setSelectedDraft] = useState('');
  const { data, mutate } = useSWR(() => selectedDraft ? `/api/admin/registrations?draftId=${encodeURIComponent(selectedDraft)}` : null, fetcher, { refreshInterval: 5000 });
  useEffect(() => { mutate(); }, [selectedDraft]);
  // Search/filter and slider state
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleEntries, setVisibleEntries] = useState<{ [userId: string]: number }>({});

  const downloadRegistrations = async () => {
    if (!selectedDraft || !data || !drafts?.drafts) return;
    const draft = drafts.drafts.find((d: any) => d._id === selectedDraft);
    const draftName = draft ? draft.name : selectedDraft;
    try {
      const response = await fetch('/api/admin/registrations/download', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ draftId: selectedDraft })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registrations_${draftName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download registrations');
      }
    } catch (error) {
      alert('Error downloading registrations');
    }
  };

  const downloadUserRegistration = async (userId: string, userName: string, userDept: string) => {
    if (!selectedDraft || !userId || !userName || !drafts?.drafts || !userDept) return;
    const draft = drafts.drafts.find((d: any) => d._id === selectedDraft);
    const draftName = draft ? draft.name : selectedDraft;
    try {
      const response = await fetch('/api/admin/registrations/download', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ draftId: selectedDraft, userId })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userName}_${userDept}_${draftName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download user registration');
      }
    } catch (error) {
      alert('Error downloading user registration');
    }
  };

  const deleteUserRegistration = async (userId: string) => {
    if (!selectedDraft || !userId) return;
    if (!window.confirm('Are you sure you want to delete all registrations for this user?')) return;
    try {
      await fetch(`/api/admin/registrations?draftId=${encodeURIComponent(selectedDraft)}&userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      mutate();
    } catch {
      alert('Failed to delete user registration');
    }
  };

  const deleteUserEntry = async (userId: string, entryIdx: number) => {
    if (!selectedDraft || !userId) return;
    if (!window.confirm('Are you sure you want to delete this course entry for this user?')) return;
    try {
      await fetch(`/api/admin/registrations?draftId=${encodeURIComponent(selectedDraft)}&userId=${encodeURIComponent(userId)}&entryIdx=${entryIdx}`, { method: 'DELETE' });
      mutate();
    } catch {
      alert('Failed to delete course entry');
    }
  };

  const userWiseRegistrations = useMemo(() => {
    if (!data?.registrations) return [];
    const userMap = new Map();
    data.registrations.forEach((reg: any) => {
      if (!userMap.has(reg.userId)) {
        userMap.set(reg.userId, {
          userId: reg.userId,
          userName: reg.userName,
          department: reg.department,
          entries: []
        });
      }
      reg.entries.forEach((entry: any) => {
        userMap.get(reg.userId).entries.push({ ...entry });
      });
    });
    userMap.forEach(user => user.entries.sort((a: any, b: any) => Number(a.batch) - Number(b.batch)));
    return Array.from(userMap.values());
  }, [data]);

  // Filter users by search term (username or employeeId)
  const filteredUsers = userWiseRegistrations.filter(user => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      user.userName.toLowerCase().includes(term) ||
      user.userId.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Registration Overview */}
      <div className={`${cardStyles} overflow-hidden`}>
        <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-orange-50/50 to-red-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Registration Analytics</h2>
                <p className="text-sm text-gray-600">Monitor and manage course registrations</p>
              </div>
            </div>
            {selectedDraft && filteredUsers.length > 0 && (
              <button
                onClick={downloadRegistrations}
                className={buttonVariants.primary}
                title="Download All Registrations Excel"
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Excel</span>
                </div>
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Draft Selection */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Draft Period</label>
              <select
                className={`w-full h-12 px-4 text-base ${inputStyles}`}
                value={selectedDraft}
                onChange={e => setSelectedDraft(e.target.value)}
              >
                <option value="">Choose a draft to view registrations...</option>
                {drafts?.drafts?.map((draft: any) => (
                  <option key={draft._id} value={draft._id}>
                    {draft.name} ({new Date(draft.yearStart).getFullYear()}-{new Date(draft.yearEnd).getFullYear()})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Stats */}
            {selectedDraft && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{filteredUsers.length}</div>
                  <div className="text-xs text-blue-600">Total Registered Users</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Results */}
      {selectedDraft && (
        <>
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          {filteredUsers.length === 0 ? (
            <EmptyState 
              icon={BarChart3} 
              title="No registrations found" 
              description="No users have registered for courses in this draft period yet or no match for search." 
            />
          ) : (
            <div className="space-y-6">
              {filteredUsers.map(user => {
                const totalEntries = user.entries.length;
                const currentIdx = visibleEntries[user.userId] || 0;
                const showSlider = totalEntries > 5;
                // Calculate last page start index
                const lastPageStart = Math.floor((totalEntries - 1) / 5) * 5;
                // If on last page, show only the remaining entries
                const isLastPage = currentIdx === lastPageStart;
                const visible = showSlider
                  ? user.entries.slice(currentIdx, Math.min(currentIdx + 5, totalEntries))
                  : user.entries;
                return (
                  <div key={user.userId} className={`${cardStyles} overflow-hidden`}>
                    <div className="p-6 border-b border-gray-100/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.userName}</h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.userId}</span>
                              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">{user.department}</span>
                              <span className="text-gray-500">{user.entries.length} courses</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className={buttonVariants.icon}
                            onClick={() => downloadUserRegistration(user.userId, user.userName, user.department)}
                            title="Download User Registration"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className={`${buttonVariants.icon} text-red-500 hover:text-red-700 hover:bg-red-50`}
                            onClick={() => deleteUserRegistration(user.userId)}
                            title="Delete All User Registrations"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Batch</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Structure</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Credits</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Slots</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">School</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50">
                          {visible.map((entry: any, idx: number) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {entry.batch}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="font-medium text-gray-900">{entry.courseName}</div>
                                  <div className="text-xs text-gray-500 font-mono">{entry.courseCode}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex space-x-1 text-xs">
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">L:{entry.L}</span>
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">T:{entry.T}</span>
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">P:{entry.P}</span>
                                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">J:{entry.J}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900">{entry.credits}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs space-y-1">
                                  <div>FN: <span className="font-medium">{entry.fnSlots}</span></div>
                                  <div>AN: <span className="font-medium">{entry.anSlots}</span></div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-gray-600">{entry.facultySchool}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  className={`${buttonVariants.icon} text-red-500 hover:text-red-700 hover:bg-red-50`}
                                  onClick={() => deleteUserEntry(user.userId, currentIdx + idx)}
                                  title="Delete Course Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Slider Controls - correctly placed inside user card */}
                    {showSlider && (
                      <div className="flex justify-end items-center gap-2 p-2">
                        <button
                          className={`${buttonVariants.icon} disabled:opacity-50`}
                          onClick={() => setVisibleEntries(prev => ({ ...prev, [user.userId]: Math.max(0, currentIdx - 5) }))}
                          disabled={currentIdx === 0}
                          title="Previous"
                        >
                          &lt;
                        </button>
                        <span className="text-xs text-gray-600">
                          {`Showing ${currentIdx + 1}-${Math.min(currentIdx + 5, totalEntries)} of ${totalEntries}`}
                        </span>
                        <button
                          className={`${buttonVariants.icon} disabled:opacity-50`}
                          onClick={() => setVisibleEntries(prev => ({ ...prev, [user.userId]: Math.min(lastPageStart, currentIdx + 5) }))}
                          disabled={isLastPage}
                          title="Next"
                        >
                          &gt;
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminTabs() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <header className={`sticky top-0 z-40 ${glassEffect} border-b border-white/20`}>
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">Manage users, drafts, and registrations</p>
            </div>
          </div>
          <button
            className={`${buttonVariants.outline} flex items-center space-x-2`}
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className={`${cardStyles} p-2`}>
          <Tabs defaultValue="users" className="w-full">
            <div className="border-b border-gray-100/50 mb-6 px-4">
              <TabsList className="flex space-x-1 bg-transparent p-0">
                <TabsTrigger 
                  value="users" 
                  className="flex items-center space-x-2 px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="drafts" 
                  className="flex items-center space-x-2 px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Drafts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center space-x-2 px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="registrations" 
                  className="flex items-center space-x-2 px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Registrations</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-4 pb-4">
              <TabsContent value="users" className="mt-0"><UsersTab /></TabsContent>
              <TabsContent value="drafts" className="mt-0"><DraftsTab /></TabsContent>
              <TabsContent value="upload" className="mt-0"><UploadTab /></TabsContent>
              <TabsContent value="registrations" className="mt-0"><RegistrationsTab /></TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
