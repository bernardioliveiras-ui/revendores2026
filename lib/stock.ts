export type StockMovementLike = { type: string; boxes: number };
export function calculateStock(rows: StockMovementLike[]) {
  return rows.reduce((total,row)=>{
    if(row.type==="entry"||row.type==="adjustment_in") return total+row.boxes;
    if(row.type==="sale"||row.type==="adjustment_out") return total-row.boxes;
    return total;
  },0);
}
