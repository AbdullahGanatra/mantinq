export interface Asset {
  id: string
  name: string
  description?: string
  model?: string
  manufacturer?: string
  serialNumber?: string
  barcode?: string
  status: string
  category?: { id: string; name: string }
  department?: { id: string; name: string }
  room?: { id: string; name: string; floor?: { name: string; building?: { name: string } } }
  images?: any[]
  workOrders?: any[]
  issues?: any[]
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: string
  woNumber: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  asset?: { id: string; name: string }
  assignedTo?: { id: string; firstName: string; lastName: string }
  createdBy?: { id: string; firstName: string; lastName: string }
  dueDate?: string
  createdAt: string
}

export interface Issue {
  id: string
  issueNumber: string
  title: string
  description?: string
  status: string
  priority: string
  asset?: { id: string; name: string }
  reportedBy?: { id: string; firstName: string; lastName: string }
  assignedTo?: { id: string; firstName: string; lastName: string }
  createdAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  avatar?: string
  department?: { id: string; name: string }
}
