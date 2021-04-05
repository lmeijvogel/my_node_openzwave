// Copied from openzwave-shared.d.ts, since I can't seem to import it correctly.
export interface ValueId {
  value_id?: number;
  value?: string;
  node_id: number;
  class_id: number;
  instance: number;
  index: number;
  label?: string;
}
