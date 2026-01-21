import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { User, ShareInput, BillShare, Bill } from "../types";
import { shareBill } from "../api/bills";

const API_BASE = "http://localhost:8000";

export default function EditBillPage() {
const { billId } = useParams();
const navigate = useNavigate();

// Bill fields
const [description, setDescription] = useState("");
const [totalAmount, setTotalAmount] = useState("");
const [tax, setTax] = useState("");
const [tip, setTip] = useState("");
const [tipSplitEvenly, setTipSplitEvenly] = useState(false);
const [createdBy, setCreatedBy] = useState("");

const [users, setUsers] = useState<User[]>([]);

const [shares, setShares] = useState<ShareInput[]>([]);

const [loading, setLoading] = useState(false);
const [pageLoading, setPageLoading] = useState(true);

/* ---------------- Fetch users ---------------- */
useEffect(() => {
    fetch(`${API_BASE}/users`)
    .then(res => res.json())
    .then(setUsers)
    .catch(console.error);
}, []);

console.log("billId param:", billId);

/* ---------------- Fetch bill + shares ---------------- */
useEffect(() => {
    const loadBill = async () => {
    try {
        const billRes = await fetch(`${API_BASE}/bills/${Number(billId)}`);
        const bill: Bill = await billRes.json();

        setDescription(bill.description ?? "");
        setTotalAmount(String(bill.total_amount));
        setTax(String(bill.tax));
        setTip(String(bill.tip));
        setTipSplitEvenly(Boolean(bill.tip_split_evenly));
        setCreatedBy(bill.creator ? String(bill.creator.id) : "");

        const sharesRes = await fetch(`${API_BASE}/bills/${Number(billId)}/shares`);
        if (sharesRes.ok) {
            const data: BillShare[] = await sharesRes.json();
            setShares(
                data.map(s => ({
                userId: String(s.owner.id),
                amount: String(s.base_amount)
                }))
            );
        } else if (sharesRes.status === 404) {
            setShares([]);
        }

    } catch (err) {
        console.error(err);
        alert("Failed to load bill");
    } finally {
        setPageLoading(false);
    }
    };

    loadBill();
}, [Number(billId)]);

/* ---------------- Share helpers ---------------- */
const addShare = () => {
    if (shares.length >= users.length) return;
    setShares([...shares, { userId: "", amount: "" }]);
};

const updateShare = (
    index: number,
    field: "userId" | "amount",
    value: string
) => {
    const copy = [...shares];
    copy[index][field] = value;
    setShares(copy);
};

const removeShare = (index: number) => {
    setShares(shares.filter((_, i) => i !== index));
};

/* ---------------- Submit ---------------- */
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const actualTotal = shares.reduce(
            (sum, s) => sum + Number(s.amount || 0),
            0
        );

        if (shares.length > 0 && Math.abs(actualTotal - Number(totalAmount)) > 0.01) {
            alert(`Shares must add up to $${totalAmount}`);
            return;
        }

        // Update bill
        const billRes = await fetch(`${API_BASE}/bills/${billId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            description,
            total_amount: Number(totalAmount),
            tax: Number(tax || 0),
            tip: Number(tip || 0),
            tip_split_evenly: tipSplitEvenly,
            created_by: Number(createdBy),
            }),
        });

        if (!billRes.ok) throw new Error("Bill update failed");

        // Update shares
        const sharePayload = {
            shares: Object.fromEntries(
            shares.map(s => [Number(s.userId), Number(s.amount)])
            ),
        };
        
        if (!billId) {
            alert("Bill ID is missing");
            return;
        }

        await shareBill(Number(billId), sharePayload);
        // const shareRes = await fetch(
        //     `${API_BASE}/bills/${billId}/share`,
        //     {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(sharePayload),
        //     }
        // );

        // if (!shareRes.ok) throw new Error("Share update failed");

        navigate(`/bills/${billId}`);
    } catch (err: any) {
    console.error(err);
    alert(err?.message || "Failed to update bill");
    } finally {
    setLoading(false);
    }
};

if (pageLoading) return <p>Loading bill...</p>;

/* ---------------- Render ---------------- */
return (
    <div className="max-w-4xl mx-auto px-6 py-6 text-left">
    <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={() => navigate(-1)}
    >
        Cancel
    </button>

    <h1 className="text-2xl font-bold mb-4">Edit Bill</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
                <label htmlFor="description" className="block font-medium">
                Description
                </label>
                <input
                id="description"
                className="border p-2 w-full rounded"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
                <label htmlFor="totalAmount" className="block font-medium">
                Total Amount
                </label>
                <input
                id="totalAmount"
                className="border p-2 w-full rounded"
                type="number"
                step="0.01"
                placeholder="Total Amount"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
                />
            </div>

            {/* Tax */}
            <div className="space-y-2">
                <label htmlFor="tax" className="block font-medium">
                Tax
                </label>
                <input
                id="tax"
                className="border p-2 w-full rounded"
                type="number"
                step="0.01"
                placeholder="Tax"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                />
            </div>

            {/* Tip */}
            <div className="space-y-2">
                <label htmlFor="tip" className="block font-medium">
                Tip
                </label>
                <input
                id="tip"
                className="border p-2 w-full rounded"
                type="number"
                step="0.01"
                placeholder="Tip"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                />
            </div>

            {/* Tip split */}
            <label className="flex items-center gap-2 font-medium">
                <input
                type="checkbox"
                checked={tipSplitEvenly}
                onChange={(e) => setTipSplitEvenly(e.target.checked)}
                />
                Split tip evenly
            </label>

            {/* Created by */}
            <div className="space-y-2">
                <label className="block font-medium">Created by</label>
                <select
                className="border p-2 w-full rounded"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                required
                >
                <option value="">Select user</option>
                {users.map((u) => (
                    <option key={u.id} value={u.id}>
                    {u.name}
                    </option>
                ))}
                </select>
            </div>

            {/* ---------------- Shares ---------------- */}
            <div className="pt-4 space-y-3">
                <h2 className="text-xl font-semibold">Shares</h2>

                {shares.map((share, index) => (
                <div key={index} className="flex gap-2 items-center">
                    <select
                    className="border p-2 rounded flex-1"
                    value={share.userId}
                    onChange={(e) =>
                        updateShare(index, "userId", e.target.value)
                    }
                    >
                    <option value="">User</option>
                    {users
                        .filter(
                        (u) =>
                            u.id.toString() === share.userId ||
                            !shares.some(
                            (s, i) => s.userId === u.id.toString() && i !== index
                            )
                        )
                        .map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                        ))}
                    </select>

                    <input
                    className="border p-2 rounded w-28"
                    type="number"
                    step="0.01"
                    placeholder="$"
                    value={share.amount}
                    onChange={(e) =>
                        updateShare(index, "amount", e.target.value)
                    }
                    />

                    <button
                    type="button"
                    onClick={() => removeShare(index)}
                    className="text-red-500 font-bold"
                    >
                    ✕
                    </button>
                </div>
                ))}

                <button
                type="button"
                onClick={addShare}
                className="text-blue-500 font-medium"
                >
                + Add Share
                </button>
            </div>

            {/* Submit */}
            <button
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded w-full"
            >
                {loading ? "Saving..." : "Save Changes"}
            </button>
        </form>

    </div>
);
}
