import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldPlus } from "lucide-react";

import { LoadingState } from "@/components/ui/LoadingState";
import { Tooltip } from "@/components/ui/Tooltip";
import type { AdminUser, Permission } from "@/types/api";
import { adminService } from "@/services/admin";

const permissions: Permission[] = [
  "VER_PRODUCTOS",
  "CREAR_PRODUCTOS",
  "EDITAR_PRODUCTOS",
  "VER_ORDENES",
  "GESTIONAR_ORDENES",
  "VER_USUARIOS",
  "GESTIONAR_BLOG",
  "GESTIONAR_CUPONES",
  "GESTIONAR_RESENAS",
  "ELIMINAR_RESENAS"
];

const usersQueryKey = ["admin-users"];

type PendingAction =
  | {
      type: "role";
      label: string;
    }
  | {
      type: "active";
      label: string;
      nextActive: boolean;
    }
  | {
      type: "permissions";
      label: string;
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

export const AdminSubAdminsPage = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
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

  const roleMutation = useMutation({
    mutationFn: ({ userId, rol }: { userId: string; rol: AdminUser["rol"] }) =>
      adminService.updateUserRole(userId, rol),
    onMutate: async ({ userId, rol }) => {
      setPending(userId, {
        type: "role",
        label: rol === "SUB_ADMIN" ? "Convirtiendo en subadmin..." : "Retirando acceso subadmin..."
      });
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData<{ items: AdminUser[] }>(usersQueryKey);

      queryClient.setQueryData<{ items: AdminUser[] }>(usersQueryKey, (current) =>
        updateUsersCache(current, userId, (user) => ({
          ...user,
          rol,
          permisos: rol === "SUB_ADMIN" ? user.permisos : []
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

  const activeMutation = useMutation({
    mutationFn: ({ userId, activo }: { userId: string; activo: boolean }) =>
      adminService.updateUserActive(userId, activo),
    onMutate: async ({ userId, activo }) => {
      setPending(userId, {
        type: "active",
        label: activo ? "Activando subadmin..." : "Desactivando subadmin...",
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

  const permissionsMutation = useMutation({
    mutationFn: ({ userId, permisos }: { userId: string; permisos: Permission[] }) =>
      adminService.updateUserPermissions(userId, permisos),
    onMutate: async ({ userId, permisos }) => {
      setPending(userId, { type: "permissions", label: "Guardando permisos..." });
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData<{ items: AdminUser[] }>(usersQueryKey);

      queryClient.setQueryData<{ items: AdminUser[] }>(usersQueryKey, (current) =>
        updateUsersCache(current, userId, (user) => ({
          ...user,
          permisos
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

  const users = useMemo(() => usersQuery.data?.items ?? [], [usersQuery.data?.items]);
  const subAdmins = useMemo(() => users.filter((user) => user.rol === "SUB_ADMIN"), [users]);
  const promotableUsers = useMemo(
    () => users.filter((user) => user.rol === "CLIENTE"),
    [users]
  );

  if (usersQuery.isLoading) {
    return <LoadingState label="Cargando subadmins..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Subadmins</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Gestion centralizada
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-300">
          Desde aquí puedes convertir usuarios en subadmins, activar o desactivar accesos y ajustar permisos granulares.
        </p>
      </section>

      <section className="surface space-y-5 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-ember/10 p-3 text-ember">
            <ShieldPlus size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Promover usuario a subadmin</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              El usuario aparecerá aquí para configurar sus permisos apenas cambie de rol.
            </p>
          </div>
        </div>

        {promotableUsers.length > 0 ? (
          <div className="flex flex-col gap-3 md:flex-row">
            <Tooltip label="Selecciona un usuario para convertirlo en subadmin">
              <select
                aria-label="Selecciona un usuario para promover"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm transition hover:border-ember focus:border-ember dark:border-white/10 dark:bg-white/5"
              >
                <option value="">Selecciona un usuario</option>
                {promotableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} - {user.email}
                    {user.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </select>
            </Tooltip>
            <Tooltip label={selectedUserId ? "Convertir en subadmin" : "Selecciona un usuario primero"}>
              <button
                type="button"
                disabled={!selectedUserId || roleMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                onClick={async () => {
                  await roleMutation.mutateAsync({
                    userId: selectedUserId,
                    rol: "SUB_ADMIN"
                  });
                  setSelectedUserId("");
                }}
              >
                {roleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldPlus size={14} />}
                Convertir en subadmin
              </button>
            </Tooltip>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            No hay usuarios cliente disponibles para promover en este momento.
          </p>
        )}
      </section>

      <div className="space-y-4">
        {subAdmins.length > 0 ? (
          subAdmins.map((user) => {
            const pendingAction = pendingByUserId[user.id];
            const isBusy = Boolean(pendingAction);
            const statusTooltip = user.activo ? "Desactivar subadmin" : "Activar subadmin";

            return (
              <div
                key={user.id}
                className="surface space-y-5 p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-slate-950 dark:text-white">{user.nombre}</p>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                        SUB_ADMIN
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{user.email}</p>
                    {pendingAction ? (
                      <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-ember">
                        <Loader2 size={14} className="animate-spin" />
                        {pendingAction.label}
                      </p>
                    ) : null}
                  </div>

                  <Tooltip label={statusTooltip}>
                    <button
                      type="button"
                      aria-label={statusTooltip}
                      disabled={isBusy}
                      className={`inline-flex min-w-[164px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
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

                  <Tooltip label="Quitar permisos de subadmin y devolver a cliente">
                    <button
                      type="button"
                      disabled={isBusy}
                      className="rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:hover:bg-red-500/10"
                      onClick={() =>
                        void roleMutation.mutateAsync({
                          userId: user.id,
                          rol: "CLIENTE"
                        })
                      }
                    >
                      Pasar a cliente
                    </button>
                  </Tooltip>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {permissions.map((permission) => {
                    const checked = user.permisos.includes(permission);

                    return (
                      <label
                        key={permission}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm transition hover:border-ember hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                        title={checked ? `Quitar ${permission}` : `Asignar ${permission}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isBusy}
                          onChange={(event) => {
                            const nextPermissions = event.target.checked
                              ? [...user.permisos, permission]
                              : user.permisos.filter((item) => item !== permission);

                            void permissionsMutation.mutateAsync({
                              userId: user.id,
                              permisos: nextPermissions
                            });
                          }}
                        />
                        {permission}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <section className="surface p-8">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Aún no hay subadmins creados. Puedes promover uno desde el bloque superior.
            </p>
          </section>
        )}
      </div>
    </div>
  );
};
