import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { LoadingState } from "@/components/ui/LoadingState";
import { Tooltip } from "@/components/ui/Tooltip";
import type { AdminUser } from "@/types/api";
import { adminService } from "@/services/admin";

const usersQueryKey = ["admin-users"];

type PendingAction = {
  type: "active";
  label: string;
  nextActive: boolean;
};

const updateUsersCache = (
  current: { items: AdminUser[] } | undefined,
  userId: string,
  updater: (user: AdminUser) => AdminUser
) => {
  if (!current) {
    return current;
  }

  return {
    ...current,
    items: current.items.map((user) => (user.id === userId ? updater(user) : user))
  };
};

export const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [pendingByUserId, setPendingByUserId] = useState<Record<string, PendingAction | undefined>>({});
  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: () => adminService.listUsers()
  });

  const setPending = (userId: string, action?: PendingAction) => {
    setPendingByUserId((current) => {
      if (!action) {
        const next = { ...current };
        delete next[userId];
        return next;
      }

      return {
        ...current,
        [userId]: action
      };
    });
  };

  const activeMutation = useMutation({
    mutationFn: ({ userId, activo }: { userId: string; activo: boolean }) =>
      adminService.updateUserActive(userId, activo),
    onMutate: async ({ userId, activo }) => {
      setPending(userId, {
        type: "active",
        label: activo ? "Activando usuario..." : "Desactivando usuario...",
        nextActive: activo
      });
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData<{ items: AdminUser[] }>(usersQueryKey);

      queryClient.setQueryData<{ items: AdminUser[] }>(usersQueryKey, (current) =>
        updateUsersCache(current, userId, (user) => ({
          ...user,
          activo
        }))
      );

      return { previous, userId };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(usersQueryKey, context?.previous);
    },
    onSettled: async (_data, _error, variables) => {
      setPending(variables.userId);
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    }
  });

  const users = useMemo(
    () => (usersQuery.data?.items ?? []).filter((user) => user.rol !== "SUB_ADMIN"),
    [usersQuery.data?.items]
  );

  if (usersQuery.isLoading) {
    return <LoadingState label="Cargando usuarios..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Usuarios</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Clientes y cuentas generales
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-300">
          La gestión de subadmins vive ahora en su propio apartado para que usuarios y permisos no se mezclen. El
          SUPER_ADMIN principal es único y no se promueve desde esta pantalla.
        </p>
      </section>
      <div className="space-y-4">
        {users.map((user) => {
          const pendingAction = pendingByUserId[user.id];
          const isSuperAdmin = user.rol === "SUPER_ADMIN";
          const isBusy = Boolean(pendingAction) || isSuperAdmin;
          const statusTooltip = isSuperAdmin
            ? "El super admin principal no se puede desactivar"
            : user.activo
              ? "Desactivar usuario"
              : "Activar usuario";

          return (
            <div key={user.id} className="surface space-y-4 p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{user.nombre}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{user.email}</p>
                  {pendingAction ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-ember">
                      <Loader2 size={14} className="animate-spin" />
                      {pendingAction.label}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center">
                  <span
                    className={`rounded-full px-4 py-3 text-sm font-semibold ${
                      isSuperAdmin
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "border border-slate-200 bg-white/90 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    }`}
                  >
                    {isSuperAdmin ? "SUPER_ADMIN PRINCIPAL" : user.rol}
                  </span>
                </div>
                <Tooltip label={statusTooltip}>
                  <button
                    type="button"
                    aria-label={statusTooltip}
                    disabled={isBusy}
                    className={`inline-flex min-w-[144px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                      user.activo
                        ? "bg-emerald-500 text-white hover:bg-emerald-400"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                    onClick={() =>
                      void activeMutation.mutateAsync({
                        userId: user.id,
                        activo: !user.activo
                      })
                    }
                  >
                    {pendingAction?.type === "active" ? <Loader2 size={14} className="animate-spin" /> : null}
                    {pendingAction?.type === "active"
                      ? pendingAction.nextActive
                        ? "Activando..."
                        : "Desactivando..."
                      : user.activo
                        ? "Activo"
                        : "Inactivo"}
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
