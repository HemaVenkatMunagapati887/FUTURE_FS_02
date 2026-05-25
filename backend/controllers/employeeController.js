import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

// @desc    Create a new employee/manager (Admin only)
// @route   POST /api/employees
// @access  Private (Admin only)
export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.statusCode = 400;
    throw new Error('Please enter all required fields');
  }

  // Enforce role limit
  const userRole = role || 'Employee';
  if (!['Employee', 'Manager'].includes(userRole)) {
    res.statusCode = 400;
    throw new Error('Can only create Employee or Manager accounts');
  }

  // Check email
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.statusCode = 400;
    throw new Error('A user with this email already exists');
  }

  const employee = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      isActive: employee.isActive,
    },
  });
});

// @desc    Get all employees/managers list (Admin & Manager)
// @route   GET /api/employees
// @access  Private (Admin & Manager only)
export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({
    role: { $in: ['Employee', 'Manager'] },
  }).select('name email role isActive').sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: employees,
  });
});

// @desc    Get employee performance analytics
// @route   GET /api/employees/performance
// @access  Private (Admin & Manager only)
export const getEmployeePerformance = asyncHandler(async (req, res) => {
  const employees = await User.find({
    role: { $in: ['Employee', 'Manager'] },
  }).select('name email role isActive');

  const performanceReport = await Promise.all(
    employees.map(async (emp) => {
      // 1. Count leads assigned
      const totalLeads = await Lead.countDocuments({ assignedTo: emp._id });

      // 2. Count converted leads
      const convertedLeads = await Lead.countDocuments({
        assignedTo: emp._id,
        status: 'Converted',
      });

      // 3. Get leads converted to clients to calculate closed revenue
      const convertedLeadDocs = await Lead.find({
        assignedTo: emp._id,
        status: 'Converted',
      }).select('_id');

      const leadIds = convertedLeadDocs.map((lead) => lead._id);
      const clients = await Client.find({ lead: { $in: leadIds } });
      const closedRevenue = clients.reduce((sum, client) => sum + client.dealValue, 0);

      // 4. Calculate conversion percentage
      const conversionRate =
        totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        isActive: emp.isActive,
        totalLeads,
        convertedLeads,
        closedRevenue,
        conversionRate,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: performanceReport,
  });
});

// @desc    Toggle employee active status (Admin only)
// @route   PUT /api/employees/:id/toggle
// @access  Private (Admin only)
export const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);

  if (!employee) {
    res.statusCode = 404;
    throw new Error('Employee not found');
  }

  // Prevent admin from disabling themselves
  if (employee._id.toString() === req.user._id.toString()) {
    res.statusCode = 400;
    throw new Error('Admin cannot deactivate their own account');
  }

  employee.isActive = !employee.isActive;
  await employee.save();

  res.status(200).json({
    success: true,
    message: `Employee account ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      _id: employee._id,
      name: employee.name,
      isActive: employee.isActive,
    },
  });
});

// @desc    Update employee details (Admin only)
// @route   PUT /api/employees/:id
// @access  Private (Admin only)
export const updateEmployee = asyncHandler(async (req, res) => {
  const { name, role } = req.body;

  const employee = await User.findById(req.params.id);

  if (!employee) {
    res.statusCode = 404;
    throw new Error('Employee not found');
  }

  if (role && !['Employee', 'Manager'].includes(role) && employee.role !== 'Admin') {
    res.statusCode = 400;
    throw new Error('Can only assign Employee or Manager roles');
  }

  employee.name = name !== undefined ? name : employee.name;
  if (role !== undefined && employee.role !== 'Admin') {
    employee.role = role;
  }

  const updatedEmployee = await employee.save();

  res.status(200).json({
    success: true,
    data: {
      _id: updatedEmployee._id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      isActive: updatedEmployee.isActive,
    },
  });
});

// @desc    Delete employee (Admin only)
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);

  if (!employee) {
    res.statusCode = 404;
    throw new Error('Employee not found');
  }

  if (employee._id.toString() === req.user._id.toString()) {
    res.statusCode = 400;
    throw new Error('Admin cannot delete their own account');
  }

  // Remove the user
  await User.deleteOne({ _id: employee._id });

  // Unassign any leads currently assigned to them
  await Lead.updateMany({ assignedTo: employee._id }, { assignedTo: null });

  res.status(200).json({
    success: true,
    message: 'Employee removed successfully',
  });
});

