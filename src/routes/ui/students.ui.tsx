import { Hono } from 'hono';
import { studentRepository } from '../../db/repository/student.repository.js';
import { batchRepository } from '../../db/repository/batch.repository.js';
import { Layout } from './layouts/layout.ui.js';

export const studentsUi = new Hono();

// Helper to format date
const formatSimpleDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Student List Component (Table view with actions)
const StudentList = ({ students }: { students: any[] }) => {
  if (students.length === 0) {
    return (
      <div
        id="student-list"
        class="mt-6 text-center text-slate-500 py-16 bg-white rounded-2xl border border-slate-100 shadow-premium"
      >
        <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p class="text-slate-800 font-medium">No students registered yet</p>
        <p class="text-sm text-slate-400 mt-1">
          Add a student using the button above to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      id="student-list"
      class="mt-6 overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-premium"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left">
          <thead class="bg-slate-50/70">
            <tr>
              <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Student Info
              </th>
              <th class="hidden sm:table-cell px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </th>
              <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Batch
              </th>
              <th class="hidden md:table-cell px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date Added
              </th>
              <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            {students.map((st) => (
              <tr class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-4 sm:px-6 py-3 sm:py-4">
                  <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-full bg-gradient-to-tr from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm border border-brand-200">
                      {st.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-slate-800 text-[14px] sm:text-[15px] truncate max-w-[120px] sm:max-w-none">
                        {st.displayName}
                      </div>
                      <div class="sm:hidden text-[11px] text-slate-400 truncate max-w-[120px]">{st.email}</div>
                      {st.pushToken ? (
                        <span class="hidden sm:inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          Push Active
                        </span>
                      ) : (
                        <span class="hidden sm:inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          No Device Token
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td class="hidden sm:table-cell whitespace-nowrap px-6 py-4 text-slate-600 text-[14px]">
                  {st.email}
                </td>
                <td class="px-4 sm:px-6 py-3 sm:py-4">
                  <span
                    class={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                      st.batchName === 'Unassigned'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-brand-50 text-brand-700 border border-brand-100'
                    }`}
                  >
                    {st.batchName}
                  </span>
                </td>
                <td class="hidden md:table-cell whitespace-nowrap px-6 py-4 text-slate-500 text-[13px]">
                  {formatSimpleDate(st.createdAt)}
                </td>
                <td class="px-4 sm:px-6 py-3 sm:py-4 text-right text-sm">
                  <div class="flex items-center justify-end gap-1 sm:gap-2">
                    <button
                      hx-get={`/ui/students/form/${st.id}`}
                      hx-target="#modal-container"
                      class="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                      title="Edit Student"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      hx-delete={`/ui/students/${st.id}`}
                      hx-target="#student-list"
                      hx-swap="outerHTML"
                      hx-confirm={`Are you sure you want to remove ${st.displayName}?`}
                      class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Student"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
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

// Create / Edit Student Modal Component
const StudentModal = ({
  student,
  batches,
}: {
  student?: any;
  batches: any[];
}) => {
  const isEdit = !!student;
  const title = isEdit ? 'Edit Student Details' : 'Register Student';
  const actionPath = isEdit ? `/ui/students/${student.id}` : '/ui/students';
  const method = isEdit ? 'hx-put' : 'hx-post';

  return (
    <div
      id="student-modal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Container */}
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-modal border border-slate-100 overflow-hidden transform translate-y-2 sm:scale-95 opacity-0 animate-[fadeInScale_0.2s_ease-out_forwards] max-h-[92vh] flex flex-col">
        <div class="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-[17px] font-bold text-slate-800">{title}</h3>
          <button
            type="button"
            onclick="document.getElementById('student-modal').remove()"
            class="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-150 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          {...{
            [method]: actionPath,
            'hx-on:htmx:after-request':
              "if(event.detail.successful) this.closest('#student-modal').remove()",
          }}
          hx-target="#student-list"
          hx-swap="outerHTML"
          class="m-0 flex-1 flex flex-col overflow-y-auto"
        >
          <div class="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Display Name */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                required
                type="text"
                name="displayName"
                value={student?.displayName || ''}
                class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                placeholder="e.g. Priom Borah"
              />
            </div>

            {/* Email Address */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                required
                type="email"
                name="email"
                value={student?.email || ''}
                class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                placeholder="e.g. student@tscs.com"
              />
            </div>

            {/* Assigned Batch */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Assign Batch
              </label>
              <div class="relative">
                <select
                  name="batchId"
                  class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 appearance-none bg-white transition-all"
                >
                  <option value="">-- Unassigned / None --</option>
                  {batches.map((b) => (
                    <option value={b.id} selected={student?.batchId === b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Push Token */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Device Token for Notifications (Optional)
              </label>
              <input
                type="text"
                name="pushToken"
                value={student?.pushToken || ''}
                class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                placeholder="Firebase/Expo push notification token"
              />
            </div>
          </div>

          <div class="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onclick="document.getElementById('student-modal').remove()"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/10 transition-colors"
            >
              Save Student
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Initial Page Load
studentsUi.get('/', async (c) => {
  const students = await studentRepository.allStudents();

  return c.html(
    <Layout activePath="/ui/students">
      {/* Header and Add Button */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-premium">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Student Directory
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage enrollments, assign classes, and view notification registry.
          </p>
        </div>
        <div>
          <button
            hx-get="/ui/students/form"
            hx-target="#modal-container"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/15 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Add New Student
          </button>
        </div>
      </div>

      {/* Student List */}
      <StudentList students={students} />
    </Layout>,
  );
});

// HTMX Endpoint: Get Student List (Partial)
studentsUi.get('/list', async (c) => {
  const students = await studentRepository.allStudents();
  return c.html(<StudentList students={students} />);
});

// HTMX Endpoint: Get Create Student Modal Form
studentsUi.get('/form', async (c) => {
  const batches = await batchRepository.allBatches();
  return c.html(<StudentModal batches={batches} />);
});

// HTMX Endpoint: Get Edit Student Modal Form
studentsUi.get('/form/:id', async (c) => {
  const id = c.req.param('id');
  const student = await studentRepository.findById(id);
  const batches = await batchRepository.allBatches();

  if (!student) return c.text('Student not found', 404);

  return c.html(<StudentModal student={student} batches={batches} />);
});

// Helper function to handle saving/updating student via form submit
const handleStudentSave = async (c: any, id?: string) => {
  const body = await c.req.parseBody();

  const displayName = body.displayName as string;
  const email = body.email as string;
  const batchId = body.batchId as string;
  const pushToken = body.pushToken as string;

  const data = {
    displayName,
    email,
    batchId: batchId || null,
    pushToken: pushToken || null,
  };

  try {
    if (id) {
      await studentRepository.update(id, data);
    } else {
      await studentRepository.create(data);
    }
  } catch (e: any) {
    // Return error message inside the list container or toast-like alert if needed.
    // For simple UI, we print the error or proceed
    console.error('Save student error:', e);
  }

  const students = await studentRepository.allStudents();
  return c.html(<StudentList students={students} />);
};

// HTMX Endpoint: Create Student
studentsUi.post('/', async (c) => {
  return handleStudentSave(c);
});

// HTMX Endpoint: Update Student
studentsUi.put('/:id', async (c) => {
  const id = c.req.param('id');
  return handleStudentSave(c, id);
});

// HTMX Endpoint: Delete Student
studentsUi.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (id) {
    await studentRepository.deleteStudent(id);
  }
  const students = await studentRepository.allStudents();
  return c.html(<StudentList students={students} />);
});
