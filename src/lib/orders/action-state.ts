export type OrderAdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const INITIAL_ORDER_ADMIN_ACTION_STATE: OrderAdminActionState = {
  status: "idle",
};
