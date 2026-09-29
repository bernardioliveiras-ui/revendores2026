type InventoryOrder = {
  boxes: number;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

type InventoryMovement = {
  type: "sale" | "return" | "adjustment_in" | "adjustment_out";
  boxes: number;
  totalValueCents: number;
  occurredAt: string;
  createdAt?: string | null;
};

export type InventorySummary = {
  received: number;
  sold: number;
  returned: number;
  stock: number;
  capacity: number;
  stockPercent: number;
  lowStockThreshold: number;
  lowStock: boolean;
  revenueCents: number;
  refundedCents: number;
  netRevenueCents: number;
};

function movementDelta(item: InventoryMovement) {
  if (item.type === "sale" || item.type === "adjustment_out") {
    return -item.boxes;
  }
  return item.boxes;
}

function movementTime(item: InventoryMovement) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.occurredAt)) {
    if (item.createdAt?.startsWith(item.occurredAt)) return item.createdAt;
    return `${item.occurredAt}T12:00:00.000Z`;
  }
  return item.occurredAt || item.createdAt || "1970-01-01T00:00:00.000Z";
}

export function summarizeInventory(
  movements: InventoryMovement[],
  orders: InventoryOrder[],
): InventorySummary {
  const delivered = orders.filter((item) => item.status === "delivered");
  const received = delivered.reduce((sum, item) => sum + item.boxes, 0);
  const sold = movements
    .filter((item) => item.type === "sale")
    .reduce((sum, item) => sum + item.boxes, 0);
  const returned = movements
    .filter((item) => item.type === "return")
    .reduce((sum, item) => sum + item.boxes, 0);
  const revenueCents = movements
    .filter((item) => item.type === "sale")
    .reduce((sum, item) => sum + item.totalValueCents, 0);
  const refundedCents = movements
    .filter((item) => item.type === "return")
    .reduce((sum, item) => sum + item.totalValueCents, 0);

  const events = [
    ...delivered.map((item) => ({
      at: item.updatedAt || item.createdAt,
      delta: item.boxes,
      priority: 0,
    })),
    ...movements.map((item) => ({
      at: movementTime(item),
      delta: movementDelta(item),
      priority: item.type === "return" || item.type === "adjustment_in" ? 0 : 1,
    })),
  ].sort((left, right) => {
    const dateOrder = left.at.localeCompare(right.at);
    return dateOrder || left.priority - right.priority;
  });

  let running = 0;
  let capacity = 0;
  for (const event of events) {
    running += event.delta;
    capacity = Math.max(capacity, running);
  }

  const stock = Math.max(0, running);
  const lowStockThreshold = capacity > 0 ? Math.max(1, Math.ceil(capacity * 0.15)) : 0;
  const stockPercent = capacity > 0 ? Math.max(0, Math.round((stock / capacity) * 100)) : 0;

  return {
    received,
    sold,
    returned,
    stock,
    capacity,
    stockPercent,
    lowStockThreshold,
    lowStock: capacity > 0 && stock <= lowStockThreshold,
    revenueCents,
    refundedCents,
    netRevenueCents: revenueCents - refundedCents,
  };
}
