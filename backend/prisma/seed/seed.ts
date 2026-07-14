import { PrismaClient, UserRole, AssetStatus, Priority, WorkOrderStatus, IssueStatus, MaintenanceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: "Demo Organization",
      slug: "demo-organization",
      description: "A demo organization for testing MaintainIQ",
      email: "demo@maintainiq.com",
      phone: "+1-555-0100",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
    },
  });

  console.log("✅ Organization created:", organization.name);

  // Create Asset Categories
  const categories = await prisma.assetCategory.createMany({
    data: [
      { name: "HVAC", description: "Heating, Ventilation, and Air Conditioning", color: "#EF4444", icon: "wind" },
      { name: "Electrical", description: "Electrical systems and components", color: "#F59E0B", icon: "zap" },
      { name: "Plumbing", description: "Plumbing and water systems", color: "#3B82F6", icon: "droplet" },
      { name: "IT Equipment", description: "Computers, servers, and networking", color: "#8B5CF6", icon: "monitor" },
      { name: "Furniture", description: "Office furniture and fixtures", color: "#10B981", icon: "sofa" },
      { name: "Safety Equipment", description: "Fire safety and emergency equipment", color: "#EC4899", icon: "shield" },
      { name: "Vehicles", description: "Company vehicles and transport", color: "#06B6D4", icon: "truck" },
      { name: "Machinery", description: "Production and manufacturing machinery", color: "#F97316", icon: "cog" },
    ],
  });

  console.log("✅ Asset categories created");

  // Create Departments
  const departments = await prisma.department.createMany({
    data: [
      { name: "Facilities", description: "Building and facilities management", color: "#2563EB", organizationId: organization.id },
      { name: "IT Support", description: "Information technology support", color: "#7C3AED", organizationId: organization.id },
      { name: "Maintenance", description: "General maintenance team", color: "#059669", organizationId: organization.id },
      { name: "Security", description: "Security and safety department", color: "#DC2626", organizationId: organization.id },
      { name: "Operations", description: "Daily operations management", color: "#D97706", organizationId: organization.id },
    ],
  });

  console.log("✅ Departments created");

  const deptList = await prisma.department.findMany({ where: { organizationId: organization.id } });

  // Create Users
  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const users = await prisma.user.createMany({
    data: [
      { email: "admin@maintainiq.com", password: hashedPassword, firstName: "John", lastName: "Admin", role: UserRole.ORGANIZATION_ADMIN, organizationId: organization.id, departmentId: deptList[0].id },
      { email: "manager@maintainiq.com", password: hashedPassword, firstName: "Sarah", lastName: "Manager", role: UserRole.MAINTENANCE_MANAGER, organizationId: organization.id, departmentId: deptList[2].id },
      { email: "tech1@maintainiq.com", password: hashedPassword, firstName: "Mike", lastName: "Technician", role: UserRole.TECHNICIAN, organizationId: organization.id, departmentId: deptList[2].id },
      { email: "tech2@maintainiq.com", password: hashedPassword, firstName: "Lisa", lastName: "Technician", role: UserRole.TECHNICIAN, organizationId: organization.id, departmentId: deptList[1].id },
      { email: "employee@maintainiq.com", password: hashedPassword, firstName: "Tom", lastName: "Employee", role: UserRole.EMPLOYEE, organizationId: organization.id, departmentId: deptList[4].id },
      { email: "viewer@maintainiq.com", password: hashedPassword, firstName: "Anna", lastName: "Viewer", role: UserRole.VIEWER, organizationId: organization.id, departmentId: deptList[4].id },
    ],
  });

  console.log("✅ Users created");

  const userList = await prisma.user.findMany({ where: { organizationId: organization.id } });

  // Create Buildings
  const building = await prisma.building.create({
    data: {
      name: "Main Building",
      description: "Primary office building",
      address: "123 Main Street, New York, NY 10001",
      organizationId: organization.id,
      floors: {
        create: [
          {
            name: "Ground Floor",
            number: 0,
            rooms: {
              create: [
                { name: "Lobby", number: "G-01" },
                { name: "Reception", number: "G-02" },
                { name: "Security Office", number: "G-03" },
                { name: "Storage A", number: "G-04" },
              ],
            },
          },
          {
            name: "First Floor",
            number: 1,
            rooms: {
              create: [
                { name: "Office 101", number: "1-01" },
                { name: "Office 102", number: "1-02" },
                { name: "Conference Room A", number: "1-03" },
                { name: "IT Server Room", number: "1-04" },
              ],
            },
          },
          {
            name: "Second Floor",
            number: 2,
            rooms: {
              create: [
                { name: "Office 201", number: "2-01" },
                { name: "Office 202", number: "2-02" },
                { name: "Break Room", number: "2-03" },
                { name: "Maintenance Workshop", number: "2-04" },
              ],
            },
          },
        ],
      },
    },
    include: { floors: { include: { rooms: true } } },
  });

  console.log("✅ Building created");

  const allRooms = building.floors.flatMap((f) => f.rooms);

  // Create Assets
  const categoryList = await prisma.assetCategory.findMany();

  const assets = await prisma.asset.createMany({
    data: [
      { name: "HVAC Unit - Main", description: "Central air conditioning unit", model: "Carrier 30RB", manufacturer: "Carrier", serialNumber: "SN123456789", barcode: "BAR001", purchaseDate: new Date("2022-01-15"), purchaseCost: 15000.00, warrantyExpiry: new Date("2027-01-15"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[0].id, departmentId: deptList[0].id, roomId: allRooms[0].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "Main Electrical Panel", description: "Primary electrical distribution panel", model: "Siemens S7", manufacturer: "Siemens", serialNumber: "SN987654321", barcode: "BAR002", purchaseDate: new Date("2021-06-20"), purchaseCost: 8000.00, warrantyExpiry: new Date("2026-06-20"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[1].id, departmentId: deptList[0].id, roomId: allRooms[1].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "Water Pump - Basement", description: "Main water circulation pump", model: "Grundfos CR", manufacturer: "Grundfos", serialNumber: "SN456789123", barcode: "BAR003", purchaseDate: new Date("2023-03-10"), purchaseCost: 3500.00, warrantyExpiry: new Date("2028-03-10"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[2].id, departmentId: deptList[0].id, roomId: allRooms[3].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "Dell Server Rack", description: "Primary server infrastructure", model: "PowerEdge R750", manufacturer: "Dell", serialNumber: "SN789123456", barcode: "BAR004", purchaseDate: new Date("2023-08-01"), purchaseCost: 25000.00, warrantyExpiry: new Date("2026-08-01"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[3].id, departmentId: deptList[1].id, roomId: allRooms[5].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "Fire Suppression System", description: "Automated fire suppression", model: "FM-200", manufacturer: "Kidde", serialNumber: "SN321654987", barcode: "BAR005", purchaseDate: new Date("2022-11-05"), purchaseCost: 12000.00, warrantyExpiry: new Date("2027-11-05"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[5].id, departmentId: deptList[3].id, roomId: allRooms[2].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "Company Van", description: "Maintenance transport vehicle", model: "Ford Transit", manufacturer: "Ford", serialNumber: "SN654987321", barcode: "BAR006", purchaseDate: new Date("2023-01-20"), purchaseCost: 45000.00, warrantyExpiry: new Date("2026-01-20"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[6].id, departmentId: deptList[2].id, roomId: allRooms[0].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "CNC Machine", description: "Computer numerical control machine", model: "Haas VF-2", manufacturer: "Haas", serialNumber: "SN147258369", barcode: "BAR007", purchaseDate: new Date("2022-04-15"), purchaseCost: 85000.00, warrantyExpiry: new Date("2025-04-15"), status: AssetStatus.UNDER_MAINTENANCE, categoryId: categoryList[7].id, departmentId: deptList[4].id, roomId: allRooms[7].id, organizationId: organization.id, createdById: userList[0].id },
      { name: "Office Chairs Set", description: "Ergonomic office chairs", model: "Herman Miller Aeron", manufacturer: "Herman Miller", serialNumber: "SN963852741", barcode: "BAR008", purchaseDate: new Date("2023-02-28"), purchaseCost: 8000.00, warrantyExpiry: new Date("2028-02-28"), status: AssetStatus.OPERATIONAL, categoryId: categoryList[4].id, departmentId: deptList[4].id, roomId: allRooms[4].id, organizationId: organization.id, createdById: userList[0].id },
    ],
  });

  console.log("✅ Assets created");

  const assetList = await prisma.asset.findMany({ where: { organizationId: organization.id } });

  // Create Work Orders
  const workOrders = await prisma.workOrder.createMany({
    data: [
      { woNumber: "WO-2024-00001", title: "HVAC Filter Replacement", description: "Replace air filters in main HVAC unit", type: MaintenanceType.PREVENTIVE, priority: Priority.MEDIUM, status: WorkOrderStatus.COMPLETED, scheduledDate: new Date("2024-01-10"), startedAt: new Date("2024-01-10T09:00:00"), completedAt: new Date("2024-01-10T11:30:00"), dueDate: new Date("2024-01-12"), estimatedHours: 3, actualHours: 2.5, estimatedCost: 150.00, actualCost: 125.00, assetId: assetList[0].id, organizationId: organization.id, assignedToId: userList[2].id, createdById: userList[1].id },
      { woNumber: "WO-2024-00002", title: "Server Maintenance", description: "Monthly server maintenance and updates", type: MaintenanceType.PREVENTIVE, priority: Priority.HIGH, status: WorkOrderStatus.IN_PROGRESS, scheduledDate: new Date("2024-01-15"), startedAt: new Date("2024-01-15T08:00:00"), dueDate: new Date("2024-01-16"), estimatedHours: 4, estimatedCost: 200.00, assetId: assetList[3].id, organizationId: organization.id, assignedToId: userList[3].id, createdById: userList[1].id },
      { woNumber: "WO-2024-00003", title: "CNC Machine Repair", description: "Repair spindle alignment issue", type: MaintenanceType.CORRECTIVE, priority: Priority.CRITICAL, status: WorkOrderStatus.ASSIGNED, scheduledDate: new Date("2024-01-20"), dueDate: new Date("2024-01-22"), estimatedHours: 8, estimatedCost: 500.00, assetId: assetList[6].id, organizationId: organization.id, assignedToId: userList[2].id, createdById: userList[1].id },
      { woNumber: "WO-2024-00004", title: "Fire System Inspection", description: "Quarterly fire suppression system inspection", type: MaintenanceType.PREVENTIVE, priority: Priority.HIGH, status: WorkOrderStatus.PENDING, scheduledDate: new Date("2024-01-25"), dueDate: new Date("2024-01-30"), estimatedHours: 2, estimatedCost: 300.00, assetId: assetList[4].id, organizationId: organization.id, assignedToId: userList[2].id, createdById: userList[1].id },
      { woNumber: "WO-2024-00005", title: "Van Oil Change", description: "Regular oil change and inspection", type: MaintenanceType.PREVENTIVE, priority: Priority.LOW, status: WorkOrderStatus.COMPLETED, scheduledDate: new Date("2024-01-05"), startedAt: new Date("2024-01-05T10:00:00"), completedAt: new Date("2024-01-05T11:00:00"), dueDate: new Date("2024-01-08"), estimatedHours: 1, actualHours: 1, estimatedCost: 75.00, actualCost: 80.00, assetId: assetList[5].id, organizationId: organization.id, assignedToId: userList[2].id, createdById: userList[1].id },
    ],
  });

  console.log("✅ Work orders created");

  // Create Issues
  const issues = await prisma.issue.createMany({
    data: [
      { issueNumber: "ISS-2024-00001", title: "HVAC making unusual noise", description: "The main HVAC unit is making a loud grinding noise during operation", priority: Priority.HIGH, status: IssueStatus.RESOLVED, assetId: assetList[0].id, organizationId: organization.id, reportedById: userList[4].id, assignedToId: userList[2].id, resolvedAt: new Date("2024-01-12") },
      { issueNumber: "ISS-2024-00002", title: "Server room temperature high", description: "Server room temperature is above recommended levels", priority: Priority.CRITICAL, status: IssueStatus.IN_PROGRESS, assetId: assetList[3].id, organizationId: organization.id, reportedById: userList[3].id, assignedToId: userList[3].id },
      { issueNumber: "ISS-2024-00003", title: "Water leak in basement", description: "Small water leak detected near pump area", priority: Priority.MEDIUM, status: IssueStatus.OPEN, assetId: assetList[2].id, organizationId: organization.id, reportedById: userList[4].id, assignedToId: userList[2].id },
      { issueNumber: "ISS-2024-00004", title: "Office chair broken", description: "One of the ergonomic chairs has a broken armrest", priority: Priority.LOW, status: IssueStatus.OPEN, assetId: assetList[7].id, organizationId: organization.id, reportedById: userList[4].id },
    ],
  });

  console.log("✅ Issues created");

  // Create Maintenance Schedules
  const schedules = await prisma.maintenanceSchedule.createMany({
    data: [
      { title: "Monthly HVAC Filter Check", description: "Check and replace HVAC filters", type: MaintenanceType.PREVENTIVE, priority: Priority.MEDIUM, frequency: "monthly", interval: 1, startDate: new Date("2024-01-01"), nextDueDate: new Date("2024-02-01"), estimatedHours: 2, estimatedCost: 100.00, assetId: assetList[0].id, organizationId: organization.id, assignedToId: userList[2].id },
      { title: "Quarterly Server Backup", description: "Full server backup and system check", type: MaintenanceType.PREVENTIVE, priority: Priority.HIGH, frequency: "quarterly", interval: 3, startDate: new Date("2024-01-01"), nextDueDate: new Date("2024-04-01"), estimatedHours: 4, estimatedCost: 200.00, assetId: assetList[3].id, organizationId: organization.id, assignedToId: userList[3].id },
      { title: "Annual Fire System Test", description: "Complete fire suppression system test", type: MaintenanceType.PREVENTIVE, priority: Priority.HIGH, frequency: "yearly", interval: 1, startDate: new Date("2024-01-01"), nextDueDate: new Date("2025-01-01"), estimatedHours: 3, estimatedCost: 500.00, assetId: assetList[4].id, organizationId: organization.id, assignedToId: userList[2].id },
    ],
  });

  console.log("✅ Maintenance schedules created");

  // Create Activity Logs
  const activityLogs = await prisma.activityLog.createMany({
    data: [
      { action: "LOGIN", entityType: "user", description: "User logged in", userId: userList[0].id },
      { action: "ASSET_CREATED", entityType: "asset", entityId: assetList[0].id, description: "Asset HVAC Unit - Main created", userId: userList[0].id },
      { action: "WORK_ORDER_CREATED", entityType: "workorder", description: "Work order WO-2024-00001 created", userId: userList[1].id },
      { action: "ISSUE_CREATED", entityType: "issue", description: "Issue ISS-2024-00001 reported", userId: userList[4].id },
      { action: "USER_CREATED", entityType: "user", entityId: userList[2].id, description: "User Mike Technician created", userId: userList[0].id },
    ],
  });

  console.log("✅ Activity logs created");

  // Create Notifications
  const notifications = await prisma.notification.createMany({
    data: [
      { title: "Welcome to MaintainIQ", message: "Your account has been set up successfully", type: "SYSTEM", userId: userList[0].id, organizationId: organization.id },
      { title: "New Work Order", message: "You have been assigned work order WO-2024-00002", type: "WORK_ORDER_CREATED", userId: userList[3].id, organizationId: organization.id, entityType: "workorder", entityId: "wo-2" },
      { title: "Issue Reported", message: "Critical issue reported: Server room temperature high", type: "ISSUE_CREATED", userId: userList[1].id, organizationId: organization.id, entityType: "issue", entityId: "iss-2" },
      { title: "Maintenance Due", message: "Monthly HVAC maintenance is due in 3 days", type: "MAINTENANCE_DUE", userId: userList[2].id, organizationId: organization.id, entityType: "asset", entityId: assetList[0].id },
    ],
  });

  console.log("✅ Notifications created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📧 Demo Login Credentials:");
  console.log("   Admin: admin@maintainiq.com / Password123!");
  console.log("   Manager: manager@maintainiq.com / Password123!");
  console.log("   Technician: tech1@maintainiq.com / Password123!");
  console.log("   Employee: employee@maintainiq.com / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
