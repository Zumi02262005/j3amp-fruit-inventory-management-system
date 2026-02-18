# j3amp-fruit-inventory-management-system

<span style="color:red">**Important:** Use the PUBLIC connection details below for local development</span>

## Connection Details
```env
DB_HOST=nozomi.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=tBHNMwXDrejAsaXAfqgGvuEqWwEziWtl
DB_NAME=railway
DB_PORT=17804
DB_PROTOCOL=TCP
```

## Setup

1. **Clone Repository**

2. **Install Backend Dependencies**
```
cd server
npm install
```

3. **Create server/.env file (environment)**
```env
PORT=5000
NODE_ENV=production

DB_HOST=nozomi.proxy.rlwy.net:17804
DB_USER=root
DB_PASSWORD=tBHNMwXDrejAsaXAfqgGvuEqWwEziWtl
DB_NAME=railway
DB_PORT=17804

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=8h

CLIENT_URL=http://localhost:5173
```

List of Ports


