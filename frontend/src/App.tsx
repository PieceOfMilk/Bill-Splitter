import { Routes, Route } from "react-router-dom";
import BillsPage from "./pages/BillsPage";
import BillDetailPage from "./pages/BillDetailPage";
import CreateBillPage from "./pages/CreateBillPage";
import EditBillPage from "./pages/EditBillPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<BillsPage />} />
      <Route path="/bills/:billId" element={<BillDetailPage />} />
      <Route path="/bills/new" element={<CreateBillPage />} />
      <Route path="/bills/edit/:billId" element={<EditBillPage />} />
    </Routes>
  );
}

export default App;
