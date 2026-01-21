import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Bill, BillShare } from "../types";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";

export default function BillDetailPage() {
const { billId } = useParams();
const [bill, setBill] = useState<Bill | null>(null);
const [billShares, setBillShares] = useState<BillShare[] | null>(null);
const navigate = useNavigate();

useEffect(() => {
    fetch(`${API_BASE}/bills/${billId}`)
    .then(res => res.json())
    .then(setBill)
    .catch(console.error);
}, [billId]);

useEffect(() => {
    const fetchBillShares = async () => {
        try {
        const res = await fetch(`${API_BASE}/bills/${billId}/shares`);

        if (res.status === 404) {
            // Treat 404 as "no shares"
            setBillShares([]);
            return;
        }

        if (!res.ok) {
            throw new Error(`Error fetching shares: ${res.status}`);
        }

        const data: BillShare[] = await res.json();
        setBillShares(data);

        } catch (error) {
        console.error(error);
        setBillShares([]); // fallback in case of other errors
        }
    };

    fetchBillShares();
    }, [billId]);


if (!bill) return <div>Bill Details Loading...</div>;
if (!billShares) return <div>Bill Share Details Loading...</div>;
console.log(bill);

return (
    <div className="max-w-4xl mx-auto px-6 py-6 text-left">
        <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate(`/bills/edit/${bill.id}`)}

        >
            Edit Bill
        </button>
        <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate("/")}
        >
            Back
        </button>

    <div>
        <h1>{bill.description}</h1>
        <p>Total: ${bill.total_amount}</p>
        <p>Tax: ${bill.tax}</p>
        <p>Tip: ${bill.tip}</p>
        <p>Created by {bill.creator.name}</p>
    </div>

    <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Shares</h2>

            <table className="w-full border border-gray-300 mt-4 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                <tr>
                    <th className="border px-6 py-3 text-left">User</th>
                    <th className="border px-6 py-3 text-right">Base</th>
                    <th className="border px-6 py-3 text-right">Tax</th>
                    <th className="border px-6 py-3 text-right">Tip</th>
                    <th className="border px-6 py-3 text-right">Total</th>
                </tr>
                </thead>

                <tbody>
                {billShares.length === 0 && (
                    <tr>
                    <td
                        colSpan={5}
                        className="border p-4 text-center text-gray-500"
                    >
                        No shares
                    </td>
                    </tr>
                )}

                {billShares.map((share) => (
                    <tr key={share.owner.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium">
                        {share.owner.name}
                    </td>
                    <td className="border p-2 text-right">
                        ${share.base_amount.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                        ${share.tax_amount.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                        ${share.tip_amount.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right font-semibold">
                        ${share.total_owed.toFixed(2)}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);
}
