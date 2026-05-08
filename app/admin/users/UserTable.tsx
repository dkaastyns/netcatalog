"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface UserTableProps {
  initialUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

export default function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Role Change Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleChangeData, setRoleChangeData] = useState<{ userId: string; newRole: string } | null>(null);

  const handleRoleChangeClick = (userId: string, newRole: string) => {
    setRoleChangeData({ userId, newRole });
    setIsRoleModalOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeData) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${roleChangeData.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleChangeData.newRole }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === roleChangeData.userId ? { ...u, role: roleChangeData.newRole } : u));
        setIsRoleModalOpen(false);
        router.refresh();
      }
    } catch {
      alert("Gagal memperbarui peran");
    } finally {
      setIsLoading(false);
      setRoleChangeData(null);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete));
        setIsDeleteModalOpen(false);
        router.refresh();
      }
    } catch {
      alert("Gagal menghapus pengguna");
    } finally {
      setIsLoading(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
      <table className="nc-table">
        <thead>
          <tr>
            <th>Pengguna</th>
            <th>Email</th>
            <th>Peran</th>
            <th>Tanggal Bergabung</th>
            <th style={{ textAlign: "right" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: user.role === 'admin' ? "var(--blue-mirage)" : "var(--surface-2)",
                    color: user.role === 'admin' ? "white" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</span>
                </div>
              </td>
              <td style={{ fontSize: 13 }}>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChangeClick(user.id, e.target.value)}
                  style={{ border: "none", background: "none", fontWeight: 700, cursor: "pointer", color: user.role === 'admin' ? "var(--amber-600)" : "var(--text-muted)" }}
                >
                  <option value="user">USER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </td>
              <td style={{ color: "var(--text-faint)", fontSize: 12 }}>
                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </td>
              <td>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button onClick={() => handleDeleteClick(user.id)} style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #fca5a5", borderRadius: "var(--radius-md)", background: "#fff5f5", color: "var(--red-600)", cursor: "pointer", fontWeight: 600 }}>Hapus</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pengguna"
        message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua akses terkait."
        confirmText="Hapus Pengguna"
        isLoading={isLoading}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onConfirm={handleConfirmRoleChange}
        title="Ubah Peran Pengguna"
        message={`Apakah Anda yakin ingin mengubah peran pengguna ini menjadi ${roleChangeData?.newRole.toUpperCase()}?`}
        confirmText="Ubah Peran"
        isLoading={isLoading}
        variant="warning"
      />
    </div>
  );
}
