import type { Bill, BillCreate, BillShareCreate } from "../types";

const API_BASE = "http://localhost:8000";

export async function getBills(): Promise<Bill[]> {
    const res = await fetch(`${API_BASE}/bills`);
    if (!res.ok) throw new Error("Failed to fetch bills");
    return res.json();
}

export async function createBill(bill: BillCreate): Promise<Bill> {
    const res = await fetch(`${API_BASE}/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
    });
    if (!res.ok) throw new Error("Failed to create bill");
    return res.json();
}

export async function shareBill(
    billId: number,
    payload: BillShareCreate
) {
    const res = await fetch(`${API_BASE}/bills/${billId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to share bill");
}

export async function deleteBill(id: number) {
    const res = await fetch(`${API_BASE}/bills/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("Failed to delete bill");
    }
}