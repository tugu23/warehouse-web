# Agent Permissions Fix

## Issue
Sales agents are receiving a "You do not have permission to create order" error when trying to create orders. Additionally, agents were seeing all orders instead of only their own orders.

## Frontend Changes Applied ✅

### 1. Order Filtering for Agents
Updated `src/features/orders/OrdersPage.tsx` to filter orders based on user role:
- **Agents (SalesAgent role)**: Can now see only orders they created
- **Admins and Managers**: Continue to see all orders

The filtering logic checks if the logged-in user is a SalesAgent and filters the orders by `createdById` matching the user's ID.

### 2. Create Permission
The frontend already allows agents to create orders via the `canCreate()` hook which includes the 'SalesAgent' role.

## Backend Changes Required 🔧

The backend is returning a 403 (Forbidden) error when agents try to create orders. The following changes are needed in the backend API:

### 1. Update Order Creation Permissions

In your backend order creation endpoint (likely `/api/orders` POST route), update the permission middleware to allow SalesAgent role:

```javascript
// Example for Express.js with middleware
// Before:
router.post('/orders', requireRole(['Admin', 'Manager']), createOrder);

// After:
router.post('/orders', requireRole(['Admin', 'Manager', 'SalesAgent']), createOrder);
```

### 2. Update Order Listing Endpoint (Optional but Recommended)

For better performance, add server-side filtering in the GET `/api/orders` endpoint:

```javascript
// In your orders controller/service
async function getOrders(req, res) {
  const { user } = req; // from auth middleware
  
  let query = {};
  
  // If user is a SalesAgent, only return their orders
  if (user.role === 'SalesAgent') {
    query.createdById = user.id;
  }
  
  const orders = await Order.find(query)
    .populate('customer')
    .populate('distributor')
    .populate('createdBy')
    .populate('orderItems.product');
    
  res.json({
    status: 'success',
    data: { orders }
  });
}
```

### 3. Verify Order Update/Status Change Permissions

Ensure agents can update the status of their own orders:

```javascript
// Example permission check
async function updateOrderStatus(req, res) {
  const { user } = req;
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  // Allow if user is Admin/Manager OR if user is the order creator
  if (user.role !== 'Admin' && user.role !== 'Manager' && order.createdById !== user.id) {
    return res.status(403).json({ message: 'You do not have permission to update this order' });
  }
  
  // Update logic here...
}
```

## Testing Checklist

### Frontend Testing ✅
- [x] Agents can see the "Create Order" button
- [x] Agents only see orders they created in the orders list
- [x] Admins/Managers see all orders

### Backend Testing Required 🔧
- [ ] Agents can successfully create orders without 403 error
- [ ] Agents can update status of their own orders
- [ ] Agents cannot see or modify orders created by other agents
- [ ] Admins/Managers can see and modify all orders

## API Endpoints to Update

1. **POST /api/orders** - Add SalesAgent to allowed roles
2. **GET /api/orders** - Add filtering by createdById for SalesAgent role
3. **PUT /api/orders/:id/status** - Allow agents to update their own orders
4. **GET /api/orders/:id** - Verify agents can view their own order details

## Database Schema Verification

Ensure the Order model has the following fields:
- `createdById`: Number/ObjectId - References the user who created the order
- `createdBy`: Object - Populated user object with name, email, role

## Role Definition

Make sure the backend recognizes these role values:
- `Admin` - Full access
- `Manager` - Full access
- `SalesAgent` - Limited access (own orders only)

## Security Considerations

✅ **Implemented**:
- Frontend filtering prevents agents from seeing others' orders
- Only show "Create Order" button to authorized users

⚠️ **Backend Required**:
- Server-side validation to prevent agents from accessing other agents' orders
- Proper role-based access control (RBAC) in API endpoints
- Verify createdById on all order operations

## Contact

If you need help implementing these backend changes, please refer to:
- Backend repository documentation
- API authentication/authorization middleware
- Role-based access control (RBAC) implementation

