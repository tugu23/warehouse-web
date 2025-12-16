# Backend Permission Fix - Code Templates

## Fix #1: Update Order Creation Permission (REQUIRED)

### For Express.js with Custom Middleware

```javascript
// routes/orders.js or similar

// BEFORE (agents get 403 error):
router.post('/orders', 
  authenticate,
  requireRole(['Admin', 'Manager']), 
  orderController.createOrder
);

// AFTER (agents can create orders):
router.post('/orders', 
  authenticate,
  requireRole(['Admin', 'Manager', 'SalesAgent']), 
  orderController.createOrder
);
```

### For Express.js with Permission Array

```javascript
// config/permissions.js or similar

// BEFORE:
const ORDER_PERMISSIONS = {
  create: ['Admin', 'Manager'],
  read: ['Admin', 'Manager', 'SalesAgent'],
  update: ['Admin', 'Manager'],
  delete: ['Admin']
};

// AFTER:
const ORDER_PERMISSIONS = {
  create: ['Admin', 'Manager', 'SalesAgent'],  // Added SalesAgent
  read: ['Admin', 'Manager', 'SalesAgent'],
  update: ['Admin', 'Manager', 'SalesAgent'],  // Allow agents to update own orders
  delete: ['Admin']
};
```

### For Custom Authorization Function

```javascript
// middleware/authorization.js or similar

// BEFORE:
function canCreateOrder(user) {
  return ['Admin', 'Manager'].includes(user.role);
}

// AFTER:
function canCreateOrder(user) {
  return ['Admin', 'Manager', 'SalesAgent'].includes(user.role);
}
```

## Fix #2: Filter Orders by User Role (RECOMMENDED)

### In Order Controller/Service

```javascript
// controllers/orderController.js

async function getOrders(req, res) {
  try {
    const { user } = req; // From authentication middleware
    
    // Build query based on user role
    let query = {};
    
    // If user is a SalesAgent, only show their orders
    if (user.role === 'SalesAgent') {
      query.createdById = user.id;
    }
    // Admin and Manager see all orders (no filter)
    
    // Fetch orders with query filter
    const orders = await Order.find(query)
      .populate('customer')
      .populate('distributor')
      .populate('createdBy')
      .populate({
        path: 'orderItems',
        populate: { path: 'product' }
      })
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      data: { orders }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
```

### Alternative: Using Query Parameters

```javascript
async function getOrders(req, res) {
  try {
    const { user } = req;
    let { createdById, status, customerId } = req.query;
    
    let query = {};
    
    // Force filter for SalesAgent
    if (user.role === 'SalesAgent') {
      query.createdById = user.id;
    } else if (createdById) {
      // Admin/Manager can filter by specific agent
      query.createdById = createdById;
    }
    
    // Add other filters
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    
    const orders = await Order.find(query)
      .populate('customer distributor createdBy')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      data: { orders }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
```

## Fix #3: Secure Order Updates

```javascript
// middleware/orderPermissions.js

async function canUpdateOrder(req, res, next) {
  try {
    const { user } = req;
    const orderId = req.params.id;
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Admin and Manager can update any order
    if (['Admin', 'Manager'].includes(user.role)) {
      return next();
    }
    
    // SalesAgent can only update their own orders
    if (user.role === 'SalesAgent' && order.createdById === user.id) {
      return next();
    }
    
    // Not authorized
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to update this order'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

// Use in routes
router.put('/orders/:id/status', 
  authenticate, 
  canUpdateOrder,  // Custom middleware
  orderController.updateStatus
);
```

## Fix #4: Verify Role Constants

Make sure your role definitions match exactly:

```javascript
// constants/roles.js or config/roles.js

const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES_AGENT: 'SalesAgent'  // Make sure this matches exactly
};

// Or as array
const VALID_ROLES = ['Admin', 'Manager', 'SalesAgent'];

module.exports = { USER_ROLES, VALID_ROLES };
```

## Testing the Backend Fix

### Using curl or Postman

```bash
# 1. Login as agent to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"agent@example.com","password":"password123"}'

# Copy the token from response

# 2. Try to create an order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "customerId": 1,
    "paymentMethod": "Cash",
    "items": [{"productId": 1, "quantity": 10}]
  }'

# Should return 201 (success) instead of 403 (forbidden)
```

### Check Logs

Look for these in your backend logs:
```
✅ Good: "Order created successfully by user 5 (SalesAgent)"
❌ Bad: "Permission denied: SalesAgent not allowed to create orders"
```

## Common Mistakes to Avoid

1. **Case sensitivity**: Make sure role names match exactly
   - ✅ `'SalesAgent'`
   - ❌ `'salesagent'`, `'sales_agent'`, `'SalesAgent '` (extra space)

2. **Middleware order**: Authentication must come before authorization
   ```javascript
   // Correct order:
   router.post('/orders', authenticate, authorize, createOrder);
   
   // Wrong order:
   router.post('/orders', authorize, authenticate, createOrder);
   ```

3. **Token validation**: Ensure the JWT token contains the user role
   ```javascript
   // In your JWT payload:
   const token = jwt.sign({
     id: user.id,
     email: user.email,
     role: user.role  // Make sure this is included
   }, SECRET_KEY);
   ```

## Database Check

Verify your User/Employee model has the role field:

```javascript
// models/User.js or models/Employee.js

const UserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'SalesAgent'],
    default: 'SalesAgent'
  }
});
```

## Quick Validation

After making changes, restart your backend server and test:

1. Login as agent
2. Create order → Should succeed (201)
3. View orders → Should see only own orders
4. Update own order → Should succeed
5. Try to update another agent's order → Should fail (403)

---

**Need more help?** Check your backend framework's documentation for role-based access control (RBAC).

