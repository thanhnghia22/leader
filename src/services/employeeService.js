import api from './api';
import { USE_REAL_API, authService } from './authService';
import { initLocalStorage } from './mockData';

initLocalStorage();

function getMockEmployees() {
  const data = localStorage.getItem('mock_employees');
  return data ? JSON.parse(data) : [];
}

function saveMockEmployees(employees) {
  localStorage.setItem('mock_employees', JSON.stringify(employees));
}

export const employeeService = {
  async getEmployees(params = {}) {
    if (USE_REAL_API) {
      const res = await api.get('/employees', { params });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    let employees = getMockEmployees();

    if (params.search) {
      const term = params.search.toLowerCase().trim();
      employees = employees.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.code.toLowerCase().includes(term) ||
          e.phone.includes(term) ||
          e.position.toLowerCase().includes(term)
      );
    }

    if (params.status) {
      employees = employees.filter((e) => e.status === params.status);
    }

    return employees;
  },

  async getEmployeeById(id) {
    if (USE_REAL_API) {
      const res = await api.get(`/employees/${id}`);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const employees = getMockEmployees();
    const emp = employees.find((e) => String(e.id) === String(id));
    if (!emp) throw new Error('Không tìm thấy nhân viên');
    return emp;
  },

  async createEmployee(employeeData) {
    if (USE_REAL_API) {
      const res = await api.post('/employees', employeeData);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 300));
    const employees = getMockEmployees();
    const newEmployee = {
      ...employeeData,
      id: Date.now(),
      code: employeeData.code || `NV${String(employees.length + 1).padStart(3, '0')}`,
      dailySalary: Number(employeeData.dailySalary) || 0,
      status: employeeData.status || 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    employees.push(newEmployee);
    saveMockEmployees(employees);
    return newEmployee;
  },

  async updateEmployee(id, employeeData) {
    if (USE_REAL_API) {
      const res = await api.put(`/employees/${id}`, employeeData);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 300));
    const employees = getMockEmployees();
    const index = employees.findIndex((e) => String(e.id) === String(id));
    if (index === -1) throw new Error('Không tìm thấy nhân viên để cập nhật');

    employees[index] = {
      ...employees[index],
      ...employeeData,
      dailySalary: Number(employeeData.dailySalary) || employees[index].dailySalary
    };
    saveMockEmployees(employees);
    return employees[index];
  },

  async deleteEmployee(id) {
    if (USE_REAL_API) {
      const res = await api.delete(`/employees/${id}`);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const employees = getMockEmployees();
    const filtered = employees.filter((e) => String(e.id) !== String(id));
    saveMockEmployees(filtered);
    return { success: true, message: 'Đã xóa nhân viên thành công' };
  }
};

export default employeeService;
