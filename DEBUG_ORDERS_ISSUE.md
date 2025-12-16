# 🔍 Orders харагдахгүй байна - Шалгах зүйлүүд

## Яг одоо хийх шалгалт:

### 1. Browser Console шалгах (F12)

**Orders хуудсанд байхдаа:**

```javascript
// Console-д энийг бич:
console.log('Orders state:', orders);
console.log('Loading:', loading);
console.log('User:', user);
console.log('Is Sales Agent:', isSalesAgent());
```

### 2. API Response шалгах

**Console-д энийг ажиллуул:**

```javascript
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

console.log('Token:', token);
console.log('User ID:', user?.id);
console.log('User Role:', user?.role);

fetch('http://localhost:3000/api/orders?limit=0', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((r) => r.json())
  .then((data) => {
    console.log('Full API Response:', data);
    console.log('Orders array:', data.data.orders);
    console.log('Orders count:', data.data.orders?.length);

    // Filter test
    if (user?.role === 'SalesAgent') {
      const filtered = data.data.orders.filter((o) => o.createdById === user.id);
      console.log('Filtered orders for agent:', filtered);
      console.log('Filtered count:', filtered.length);
    }
  });
```

## 🎯 Магадгүй асуудлууд:

### Асуудал 1: API Structure өөрчлөгдсөн байж болно

Backend response бүтэц:

```json
{
  "status": "success",
  "data": {
    "orders": [...]     ← Энд байх ёстой
  }
}
```

Эсвэл:

```json
{
  "status": "success",
  "orders": [...]      ← Шууд энд байж болно
}
```

### Асуудал 2: Filtering хэт их фильтэрлэж байж болно

OrdersPage.tsx line 38-40:

```typescript
if (isSalesAgent() && user) {
  allOrders = allOrders.filter((order) => order.createdById === user.id);
}
```

Магадгүй:

- `user.id` буруу байж болно
- `order.createdById` өөр type байж болно (string vs number)

### Асуудал 3: Cache-д хуучин өгөгдөл байж болно

Hard refresh хий:

- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + R

## 🚀 Шуурхай шийдэл:

### Debugging code-оор OrdersPage.tsx-г засъя:

Line 31-48-ийг энэ болго:

```typescript
const fetchOrders = async () => {
  setLoading(true);
  try {
    const response = await ordersApi.getAll({ limit: 0 });

    // DEBUG: Console-д response харуулах
    console.log('🔍 Full API Response:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 Current user:', user);
    console.log('🔍 Is SalesAgent:', isSalesAgent());

    let allOrders = response.data.orders || [];
    console.log('🔍 All orders before filter:', allOrders);
    console.log('🔍 Orders count:', allOrders.length);

    // Filter orders for sales agents - they should only see their own orders
    if (isSalesAgent() && user) {
      console.log('🔍 Filtering for agent ID:', user.id);
      allOrders = allOrders.filter((order) => {
        console.log(
          '🔍 Order',
          order.id,
          'createdById:',
          order.createdById,
          'user.id:',
          user.id,
          'match:',
          order.createdById === user.id
        );
        return order.createdById === user.id;
      });
      console.log('🔍 Filtered orders:', allOrders);
    }

    console.log('🔍 Final orders to display:', allOrders);
    setOrders(allOrders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};
```

## 📋 Console output-ийг хайж байгаа зүйлс:

Та console-д дараах зүйлсийг харах хэрэгтэй:

1. ✅ `All orders before filter: [4 orders]`
2. ✅ `Filtering for agent ID: 3`
3. ✅ `Orders count: 4`
4. ❓ `Filtered orders: [...]` - Энд хэдэн order байгаа?

## 🎯 Type mismatch байж болно!

Магадгүй `createdById` болон `user.id` type нь тохирохгүй байж болно:

```typescript
// Магадгүй:
order.createdById = '3'; // string
user.id = 3; // number

// === comparison нь false буцаана!
```

**Шийдэл:**

```typescript
allOrders = allOrders.filter((order) => Number(order.createdById) === Number(user.id));
```

Эсвэл:

```typescript
allOrders = allOrders.filter(
  (order) => order.createdById == user.id // == loose equality
);
```

---

**Console-ийн output-ийг надад хуулж өгөөрөй! Тэгвэл би яг юу буруу байгааг олж өгнө.** 🔍
