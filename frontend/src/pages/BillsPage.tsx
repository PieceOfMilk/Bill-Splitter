import { useEffect, useState } from "react";
import { getBills, deleteBill } from "../api/bills";
import type { Bill } from "../types";
import { useNavigate } from "react-router-dom";

export default function BillsPage() {
const [bills, setBills] = useState<Bill[]>([]);
const navigate = useNavigate();

useEffect(() => {
    getBills().then(setBills).catch(console.error);
}, []);

const handleDelete = async (id: number) => {
    if (!confirm("Delete this bill?")) return;

    try {
    await deleteBill(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
    console.error(err);
    alert("Failed to delete bill");
    }
};

return (
    <div className="max-w-5xl mx-auto px-6 py-6 flex place-items-center ">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Bills</h1>
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => navigate("/bills/new")}
            >
                Add Bill
            </button>
        </div>

        <table className="w-full border-collapse border">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Total</th>
                    <th className="border p-2 text-left">Created By</th>
                    <th className="border p-2 text-center">Actions</th>
                </tr>
            </thead>

            <tbody>
                {bills.length === 0 && (
                    <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">
                        No bills yet
                    </td>
                    </tr>
                )}

                {bills.map((bill) => (
                    <tr
                        key={bill.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/bills/${bill.id}`)}
                    >
                        <td className="border p-2">
                            {bill.description || "Untitled bill"}
                        </td>
                        <td className="border p-2">
                            ${bill.total_amount.toFixed(2)}
                        </td>
                        <td className="border p-2">
                            {bill.creator.name}
                        </td>
                        <td
                            className="border p-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => handleDelete(bill.id)}
                                className="text-red-500 hover:text-red-700 font-medium"
                            >
                            Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
}
