export const dynamic = 'force-dynamic';

import { query } from "@/lib/db";
import UserTable from "./UserTable";

async function getUsers() {
  return query<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>(`
    SELECT "id", "name", "email", "role", "createdAt"
    FROM "user"
    ORDER BY "createdAt" DESC
  `);
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>User Management</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2 }}>Manage administrative access and partner permissions</p>
        </div>
      </div>

      <UserTable initialUsers={users} />
    </div>
  );
}
