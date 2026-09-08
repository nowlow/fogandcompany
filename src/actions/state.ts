/**
 * Shape of every server-action result. Kept free of server imports so client
 * components can hold it without dragging the database into the bundle.
 */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** set when the host has to confirm something destructive */
  confirm?: {
    token: string;
    title: string;
    detail: string;
    items: string[];
  };
};

export const idle: ActionState = {};
